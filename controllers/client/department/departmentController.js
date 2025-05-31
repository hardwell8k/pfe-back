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

        const result = clientSchema.safeParse({client_id:Number(req.params.client_id)});

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }
        const {client_id} = result.data;

        const query = 'SELECT "ID",nom,department,num_tel,email,client_id FROM department WHERE client_id = $1 ';
        const values = [client_id];

        const data = await pool.query(query,values);
        return res.status(200).json({success:true,message:"success",data:data.rows});

    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

const UpdateDepartment = async(req,res)=>{
    try {
        const clientSchema = z.object({
            nom: z.string().trim().min(1).optional(),
            department: z.string().min(1).optional(),
            num_tel: z.number().int().optional(),
            email: z.string().email({ message: "Invalid email format" }).optional(),
            ID: z.number().int(),
        });

        const result = clientSchema.safeParse(req.body);
        
        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }
        const {nom,department,num_tel,email,ID} = result.data;
        if(!ID||([nom,department,num_tel,email,ID].every((value)=>(value===undefined||value==="")))){
            return res.status(400).json({success:false,message:"missing data"});
        }

        const data = {nom,department,num_tel,email}

        const FilteredBody = Object.fromEntries(Object.entries(data).filter(([key,value])=>(value!==undefined&&value!==null&&value!=="")));

        const columns = Object.keys(FilteredBody);
        const values = Object.values(FilteredBody);

        values.push(ID);

        const columnsString = (columns.map((column,index)=>`${column}=$${index+1}`)).join(',');
        const query = `UPDATE department SET ${columnsString} WHERE "ID"=$${columns.length+1} `;


        await pool.query(query,values);
        return res.status(200).json({success:true,message:"department updated"});
    } catch (error) {
        console.log(error);
        return res.status(500).json({success:false,message:error.message});
    }
}

const deleteDepartment = async(req,res)=>{
    try {
        const workshopSchema = z.object({
            ID: z.number().int(),
        });

        const result = workshopSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }
        const {ID} = req.body;

        const query = 'DELETE FROM department WHERE "ID"=$1';
        const values = [ID];

        await pool.query(query,values);

        return res.status(200).json({success : true, message: "workshop deleted with success"});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

module.exports = {addDepartment,getClientDepartments,UpdateDepartment,deleteDepartment};