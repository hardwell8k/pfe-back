const pool = require('../../dbConnection');
const {z} = require("zod");


const addClient = async(req,res)=>{
    try {
        const clientSchema = z.object({
            nom: z.string().trim().min(1, { message: "Nom is required" }),
            domain: z.string().min(1, { message: "Address is required" }),
            num_tel: z.number().int({message: "num is required and must be an integer"}),
            email: z.string().email({ message: "Invalid email format" })
        });
        
        const result = clientSchema.safeParse(req.body);
        
        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }
        
        const {nom,domain,num_tel,email} = result.data;
        
        const decoded_token = req.decoded_token;
        if(!decoded_token){
            return res.status(400).json({success:false,message:"missing data"});
        }
        
        const query = 'INSERT INTO "Clients" (nom,domain,num_tel,email,entreprise_id) VALUES ($1,$2,$3,$4,(SELECT entreprise_id FROM accounts WHERE "ID" = $5))';
        const values = [nom,domain,num_tel,email,decoded_token.id];

        await pool.query(query,values);

        return res.status(200).json({success : true, message: "client added with success"});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

const deleteClient = async(req,res)=>{
    try {
        console.log(JSON.stringify(req.body))
        const clientSchema = z.object({
            IDs: z.array(z.number().int()).min(1),
        });

        const result = clientSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {IDs} = result.data;

        const query = 'DELETE FROM "Clients" WHERE "ID"= ANY($1::int[])';
        const values = [IDs];

        const {rowCount} = await pool.query(query,values);

        if(rowCount === 0){
            return res.status(404).json({success:false , message:"no clients where deleted"});
        }
        
        return res.status(200).json({success : true, message: "clients deleted with success"});
    } catch (error) {
        if (
            error?.code === '23503' &&
            error?.constraint === 'evenement_client_id_fkey'
        ) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete client(s) because they are associated with one or more events.',
            });
        }
        return res.status(500).json({success:false,message:error.message});
    }
}

//update client
const updateClient = async(req,res)=>{
    try {
        const clientSchema = z.object({
            nom: z.string().trim().min(1, { message: "Nom is required" }).optional(),
            domain: z.string().min(1, { message: "domain is required" }).optional(),
            num_tel: z.number().int({message: "num is required and must be an integer"}).optional(),
            email: z.string().email({ message: "Invalid email format" }).optional(),
            ID: z.number().int(),
        });

        const result = clientSchema.safeParse(req.body);
        
        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {ID,nom,domain,num_tel,email} = result.data;
        if(!ID||([nom,domain,num_tel,email].every((value)=>(value===undefined||value==="")))){
            return res.status(400).json({success:false,message:"missing data"});
        }

        const data = {nom,domain,num_tel,email}

        const FilteredBody = Object.fromEntries(Object.entries(data).filter(([key,value])=>(value!==undefined&&value!==null&&value!=="")));

        const columns = Object.keys(FilteredBody);
        const values = Object.values(FilteredBody);

        values.push(ID);

        const columnsString = (columns.map((column,index)=>`${column}=$${index+1}`)).join(',');
        const query = `UPDATE "Clients" SET ${columnsString} WHERE "ID"=$${columns.length+1} `;


        const {rowCount} = await pool.query(query,values);

        if(rowCount === 0){
            return res.status(404).json({success:false , message:"no client was updated"});
        }

        return res.status(200).json({success : true, message: "client updated with success"});
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
        const query = 'SELECT * FROM "Clients" WHERE  entreprise_id=(SELECT entreprise_id FROM accounts WHERE "ID" = $1)';
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