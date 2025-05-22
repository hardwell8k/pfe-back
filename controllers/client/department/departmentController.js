const pool = require('../../../dbConnection');
const {z} = require("zod");

const addDepartment = async(req,res)=>{
    try {
        const clientSchema = z.object({
            nom: z.string().trim().min(1, { message: "Nom is required" }),
            department: z.string().min(1, { message: "Address is required" }),
            num_tel: z.number().int(),
            email: z.string().email({ message: "Invalid email format" }),
            client_id: z.number().int(),
        });

        const result = clientSchema.safeParse(req.body);
        
        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }
        const {nom,department,num_tel,email,client_id} = req.body;

        const query = 'INSERT INTO department (nom,department,num_tel,email,client_id) VALUES ($1,$2,$3,$4,$5)';
        const values = [nom,department,num_tel,email,client_id];

        await pool.query(query,values);
        return res.status(200).json({success:true,message:"department added"});
    } catch (error) {
        console.log(error);
        return res.status(500).json({success:false,message:error.message});
    }
}

const getClientDepartments = async (req,res)=>{
    try {
        const clientSchema = z.object({
            client_id: z.number().int()
        });

        const result = clientSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }
        const {client_id} = req.body;

        const query = "SELECT nom,department,num_tel,email,client_id FROM department WHERE client_id = $1 ";
        const values = [client_id];

        const data = await pool.query(query,values);
        return res.status(200).json({success:true,message:"success",data:data.rows});

    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

module.exports = {addDepartment,getClientDepartments};