const pool = require('../../dbConnection');


const addClient = async(req,res)=>{
    try {
        const clientSchema = z.object({
            nom: z.string().trim().min(1, { message: "Nom is required" }),
            domain: z.string().min(1, { message: "Address is required" }),
            num_tel: z.number().int(),
            email: z.string().email({ message: "Invalid email format" })
        });

        const result = clientSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {nom,domain,num_tel,email} = req.body;

        const decoded_token = req.decoded_token;
        if(!decoded_token){
            return res.status(400).json({success:false,message:"missing data"});
        }

        const query = 'INSERT INTO "Clients" (nom,domain,num_tel,email,account_id) VALUES ($1,$2,$3,$4,$5)';
        const values = [nom,domain,num_tel,email,decoded_token.id];

        await pool.query(query,values);

        return res.status(200).json({success : true, message: "client added with success"});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

const deleteClient = async(req,res)=>{
    try {
        const clientSchema = z.object({
            ID: z.number().int()
        });

        const result = clientSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {ID} = req.body;

        const query = 'DELETE FROM "Clients" WHERE "ID"=$1';
        const values = [ID];

        await pool.query(query,values);

        return res.status(200).json({success : true, message: "client added with success"});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

//update client
const updateClient = async(req,res)=>{
    try {

        const {ID,nom,domain,num_tel,email} = req.body;
        if(!ID||([nom,domain,num_tel,email].every((value)=>(value===undefined||value==="")))){
            return res.status(400).json({success:false,message:"missing data"});
        }

        const data = {nom,address,date_debut,date_fin,description,prix}

        const FilteredBody = Object.fromEntries(Object.entries(data).filter(([key,value])=>(value!==undefined&&value!==null&&value!=="")));

        const columns = Object.keys(FilteredBody);
        const values = Object.values(FilteredBody);

        values.push(ID);

        const columnsString = (columns.map((column,index)=>`${column}=$${index+1}`)).join(',');
        const query = `UPDATE "Client" SET ${columnsString} WHERE "ID"=$${columns.length+1} `;

        console.log("query: ",query);

        await pool.query(query,values);

        return res.status(200).json({success : true, message: "client added with success"});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

const getAllClients = async(req,res)=>{
    try {
        const decoded_token = req.decoded_token;
        if(!decoded_token){
            return res.status(400).json({success:false,message:"missing data"});
        }
        const query = 'SELECT * FROM "Clients" WHERE account_id IN (SELECT "ID" FROM accounts WHERE entreprise_id=(SELECT entreprise_id FROM accounts WHERE "ID" = $1))';
        const values =[decoded_token.id];
        const data = await pool.query(query,values);
        if(!data){
            return res.status(400).json({"success":false , message:"failure"});
        }
        return res.status(200).json({success : true, message: "clients selected with success",data:data.rows});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

//const getSpecificClients = async(req,res)=>{}


module.exports = {addClient,updateClient,deleteClient,getAllClients}