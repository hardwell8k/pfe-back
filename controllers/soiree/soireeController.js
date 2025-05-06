const pool = require("../../dbConnection");
const {z} = require("zod");

const addSoiree = async(req,res)=>{
    try {
        const soireeSchema = z.object({
            nom: z.string().trim().min(1, { message: "Nom is required" }),
            address: z.string().min(1, { message: "Address is required" }),
            prix: z.number(),
            date: z.string().refine(val => !isNaN(new Date(val).getTime()), {
                message: "Invalid start date format"
            }),
            description: z.string().min().optional(),
            evenement_id: z.number().int(),
        });

        const result = soireeSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }
        const {nom,address,date,prix,evenement_id,description} = req.body;
        

        //date validation

        const query = 'INSERT INTO soire (nom,address,date,description,prix,evenement_id) VALUES ($1,$2,$3,$4,$5,$6,$7)';
        const values = [nom,address,date,description,prix,evenement_id];

        await pool.query(query,values);

        return res.status(200).json({success : true, message: "soiree added with success"});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

const updateSoiree = async(req,res)=>{
    try {
        const {ID,nom,address,date,description,prix} = req.body;
        if(!ID||([nom,address,date,description,prix].every((value)=>(value===undefined||value==="")))){
            return res.status(400).json({success:false,message:"missing data"});
        }

        //date validation

        if(prix&&Number.isNaN(Number(prix))){
            return res.status(401).json({success:false,message:"prix doit etre un nombre"});
        }

        const data = {nom,address,date,description,prix}

        const FilteredBody = Object.fromEntries(Object.entries(data).filter(([key,value])=>(value!==undefined&&value!==null&&value!=="")));

        const columns = Object.keys(FilteredBody);
        const values = Object.values(FilteredBody);

        values.push(ID);

        const columnsString = (columns.map((column,index)=>`${column}=$${index+1}`)).join(',');
        const query = `UPDATE soire SET ${columnsString} WHERE "ID"=$${columns.length+1} `;

        console.log("query: ",query);

        await pool.query(query,values);

        return res.status(200).json({success:true , message:"soiree updated with success"});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

const deleteSoiree = async(req,res)=>{
    try {
        const soireeSchema = z.object({
            ID: z.number().int(),
        });

        const result = soireeSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }
        const {ID} = req.body;

        const query = 'DELETE FROM soire WHERE "ID"=$1';
        const values = [ID];

        await pool.query(query,values);

        return res.status(200).json({success : true, message: "soiree deleted with success"});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

const getAllSoirees = async(req,res)=>{
    try {
        const decoded_token = req.decoded_token;
        if(!decoded_token){
            return res.status(400).json({success:false,message:"missing data"});
        }

        const query = 'SELECT "ID",nom,address,date,description,prix FROM soire WHERE evenement_id IN (SELECT "ID" FROM evenement WHERE client_id IN client_id IN (SELECT "ID" FROM "Clients" WHERE account_id IN(SELECT "ID" FROM accounts WHERE entreprise_id=(SELECT entreprise_id FROM accounts WHERE "ID" = $1))))';
        const values = [decoded_token.id];

        const data = await pool.query(query,values);
        if(!data){
            return res.status(400).json({"success":false , message:"failure"});
        }
        return res.status(200).json({success : true, message: "soiree fectched with success",data:data.rows});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

module.exports = {addSoiree,updateSoiree,deleteSoiree,getAllSoirees}