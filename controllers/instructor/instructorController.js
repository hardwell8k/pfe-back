const pool = require('../../dbConnection');
const {z} = require('zod');

const genderEnum = ['male', 'female', 'other']

const addInstructor = async(req,res)=>{
    try{
        const instructorSchema = z.object({
            nom: z.string().min(1, { message: "nom is required" }),
            address: z.string().min(1, { message: "address is required" }),
            age: z.number().int(),
            num_tel: z.number().int(),
            gender: z.enum(['male', 'female', 'other'], {message: "gender must be one of the following: 'male', 'female', 'other'",}),
            description: z.string().min(1, { message: "description is required" }),
        });

        const result = instructorSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({success:false, errors: result.error.errors });
        }

        const {nom,address,age,num_tel,gender,description} = req.body;
        const decoded_token = req.decoded_token;
        if(!decoded_token){
            return res.status(400).json({ success:false, message:"missing data" });
        }

        const query = 'INSERT INTO instructeur (nom,address,age,num_tel,gender,description,entreprise_id) VALUES ($1,$2,$3,$4,$5,$6,(SELECT entreprise_id FROM accounts WHERE "ID"=$7))';
        const values = [nom,address,age,num_tel,gender,description,decoded_token.id];

        await pool.query(query,values);
        return res.status(200).json({success:true , message:"instructor added with success"});
    }catch(error){
        console.error("error while deleting the events",error);
        res.status(500).json({success:false,message:"error while adding the instructors",err:error.message});
    }
}

const updateInstructor = async(req,res)=>{
    try{
        const instructorSchema = z.object({
            nom: z.string().min(1, { message: "nom is required" }),
            address: z.string().min(1, { message: "address is required" }),
            age: z.number().int(),
            num_tel: z.number().int(),
            gender: z.string().min(1, { message: "gender is required" }),
            description: z.string().min(1, { message: "description is required" }),
            ID: z.number().int().min(1),
        });

        const result = instructorSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({success:false, errors: result.error.errors });
        }

        const {nom,address,age,num_tel,gender,description,ID} = req.body;
        if(!nom&&!address&&!age&&!num_tel&&!description&&!gender){
            return res.status(400).json({ success:false, message:"missing data"});
        }

        const data = {nom,address,age,num_tel,gender,description}

        const FilteredBody = Object.fromEntries(Object.entries(data).filter(([key,value])=>(value!==undefined&&value!==null&&value!=="")));

        const columns = Object.keys(FilteredBody);
        const values = Object.values(FilteredBody);

        values.push(ID);

        const columnsString = (columns.map((column,index)=>`${column}=$${index+1}`)).join(',');
        const query = `UPDATE instructeur SET ${columnsString} WHERE "ID"=$${columns.length+1} `;

        await pool.query(query,values);
        return res.status(200).json({success:true , message:"instructor updated with success"});
    }catch(error){
        console.error("error while deleting the events",error);
        res.status(500).json({success:false,message:"error while updating the instructor",err:error.message});
    }
}

const deleteInstructor = async(req,res)=>{
    try{
        const instructorSchema = z.object({
            ID: z.number().int(),          
        });

        const result = instructorSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {ID} = req.body;

        const query = 'DELETE FROM instructeur where "ID"=$1';
        const values = [ID];

        await pool.query(query,values);
        return res.status(200).json({success:true , message:"transport deleted with success"});
    }catch(error){
        console.error("error while deleting the events",error);
        res.status(500).json({success:false,message:"error while deleting the instructor",err:error.message});
    }
}

const getAllInstructors = async(req,res)=>{
    try{

        const decoded_token = req.decoded_token;

        if(!decoded_token){
            return res.status(400).json({ success:false, message:"missing data" });
        }

        const query = 'SELECT "ID",nom,address,age,num_tel,gender,description FROM instructeur WHERE entreprise_id = (SELECT entreprise_id FROM accounts WHERE "ID"=$1)';
        const values = [decoded_token.id];

        const data = await pool.query(query,values);
        return res.status(200).json({success:true , message:"instructors fetched with success",data:data.rows});
    }catch(error){
        console.error("error while deleting the events",error);
        res.status(500).json({success:false,message:"error while fetching the instructors",err:error.message});
    }
}

const getInstructorsForWorkshop = async(req,res)=>{
    try{

        const decoded_token = req.decoded_token;

        if(!decoded_token){
            return res.status(400).json({ success:false, message:"missing data" });
        }

        const query = 'SELECT "ID",nom FROM instructeur WHERE entreprise_id = (SELECT entreprise_id FROM accounts WHERE "ID"=$1)';
        const values = [decoded_token.id];

        const data = await pool.query(query,values);
        return res.status(200).json({success:true , message:"instructors fetched with success",data:data.rows});
    }catch(error){
        console.error("error while deleting the events",error);
        res.status(500).json({success:false,message:"error while fetching the instructors",err:error.message});
    }
}

module.exports = {addInstructor,updateInstructor,deleteInstructor,getAllInstructors,getInstructorsForWorkshop}