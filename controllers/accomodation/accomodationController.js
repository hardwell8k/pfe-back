const pool = require("../../dbConnection"); 
const {z} = require("zod");

const addAccomodation = async(req,res)=>{
    try {
        const AccomodationSchema = z.object({
            nom: z.string().trim().min(1, { message: "Nom is required" }),
            address: z.string().min(1, { message: "Address is required" }),
            type: z.enum(['single', 'double', 'suite'], {message: "Type must be one of the following: 'single', 'double', 'suite'",}),
            description: z.string().min(1, { message: "Description is required" }).optional(),
            prix: z.number().min(0, { message: "Prix must be a valid number and greater than or equal to 0" }),
            date_debut: z.string().refine(val => !isNaN(new Date(val).getTime()), {
                message: "Invalid start date format"
            }),
            date_fin: z.string().refine(val => !isNaN(new Date(val).getTime()), {
                message: "Invalid end date format"
            }),
            number: z.number().min(1, { message: "Number must be a valid number and greater than 0" }),
            evenement_id: z.number().int()
        }).refine((data) => {
            const start = new Date(data.date_debut);
            const end = new Date(data.date_fin);
            return start < end;
        }, {
            message: "Start date must be before end date",
            path: ["date_fin"]
        });

        const result = AccomodationSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {nom,address,date_debut,date_fin,description,prix,type,number,evenement_id} = req.body;

        //add date validation

        const query = 'INSERT INTO accomodation (nom,address,date_debut,date_fin,description,prix,type,number,evenement_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)';
        const values = [nom,address,date_debut,date_fin,description,prix,type,number,evenement_id];

        await pool.query(query,values);

        return res.status(200).json({success : true, message: "accomodation added with success"});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

const updateAccomodation = async(req,res)=>{
    try {
        const AccomodationSchema = z.object({
            nom: z.string().trim().min(1, { message: "Nom is required" }).optional(),
            address: z.string().min(1, { message: "Address is required" }).optional(),
            type: z.enum(['male', 'female', 'non-binary', 'other'], {message: "Type must be one of the following: 'single', 'double', 'suite'",}).optional(),
            description: z.string().min(1, { message: "Description is required" }).optional(),
            prix: z.number().min(0, { message: "Prix must be a valid number and greater than or equal to 0" }).optional(),
            date_debut: z.string().refine(val => !isNaN(new Date(val).getTime()), {
                message: "Invalid start date format"
            }).optional(),
            date_fin: z.string().refine(val => !isNaN(new Date(val).getTime()), {
                message: "Invalid end date format"
            }).optional(),
            number: z.number().min(1, { message: "Number must be a valid number and greater than 0" }).optional(),
        });

        const result = AccomodationSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {ID,nom,address,date_debut,date_fin,description,prix,number,type} = req.body;
        if(!ID||([nom,address,date_debut,date_fin,description,prix,number,type].every((value)=>(value===undefined||value==="")))){
            return res.status(400).json({success:false,message:"missing data"});
        }

        const data = {nom,address,date_debut,date_fin,description,prix,number,type}

        const FilteredBody = Object.fromEntries(Object.entries(data).filter(([key,value])=>(value!==undefined&&value!==null&&value!=="")));

        const columns = Object.keys(FilteredBody);
        const values = Object.values(FilteredBody);

        values.push(ID);

        const columnsString = (columns.map((column,index)=>`${column}=$${index+1}`)).join(',');
        const query = `UPDATE accomodation SET ${columnsString} WHERE "ID"=$${columns.length+1} `;

        console.log("query: ",query);

        await pool.query(query,values);

        return res.status(200).json({success:true , message:"accomodation updated with success"});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

const deleteAccomodation = async(req,res)=>{
    try {
        const AccomodationSchema = z.object({
            ID: z.number().int()
        });

        const result = AccomodationSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }
        const {ID} = req.body;

        const query = 'DELETE FROM accomodation WHERE "ID"=$1';
        const values = [ID];

        await pool.query(query,values);

        return res.status(200).json({success : true, message: "accomodatiom deleted with success"});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

const getAllAccomodations = async(req,res)=>{
    try {
        const decoded_token = req.decoded_token;
        if(!decoded_token){
            return res.status(400).json({success:false,message:"missing data"});
        }

        const query = 'SELECT "ID",nom,type,number,address,date_debut,date_fin,description,prix FROM accomodation WHERE evenement_id IN (SELECT "ID" FROM evenement WHERE client_id IN client_id IN (SELECT "ID" FROM "Clients" WHERE account_id IN(SELECT "ID" FROM accounts WHERE entreprise_id=(SELECT entreprise_id FROM accounts WHERE "ID" = $1))))';
        const values = [decoded_token.id];

        const data = await pool.query(query,values);
        if(!data){
            return res.status(400).json({"success":false , message:"failure"});
        }
        return res.status(200).json({success : true, message: "accomodations fetched with success",data:data.rows});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

module.exports = {addAccomodation,updateAccomodation,deleteAccomodation,getAllAccomodations}