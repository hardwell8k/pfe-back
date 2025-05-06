const pool = require("../../dbConnection");
const jwt = require('jsonwebtoken');
const {z} = require("zod");

const addStaff = async (req,res)=>{
    try {
        const staffSchema = z.object({
            nom: z.string().trim().min(1, { message: "Nom is required" }),
            prenom: z.string().min(1, { message: "Address is required" }).optional(),
            role: z.string().min(1, { message: "Address is required" }),
            departement: z.string().min(1, { message: "Address is required" }).optional(),
            num_tel: z.number().int().optional(),
            email: z.string().email({ message: "Invalid email format" }).optional(),
            team_id: z.number().int().optional(),
        });

        const result = staffSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const decoded_token = req.decoded_token
        const {nom,prenom,num_tel,email,departement,role,team_id} = req.body;

        if(!decoded_token){
            return res.status(400).json({success:false,message:"missing data"});
        }

        const query = "INSERT INTO staff (nom,prenom,num_tel,email,departement,role,team_id,account_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)";
        const values = [nom,prenom,num_tel,email,departement,role,team_id,decoded_token.id];

        await pool.query(query,values);

        return res.status(200).json({success : true, message: "staff added with success"});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

const updateStaff = async (req,res)=>{
    try {
        const staffSchema = z.object({
            nom: z.string().trim().min(1, { message: "Nom is required" }).optional(),
            prenom: z.string().min(1, { message: "Address is required" }).optional(),
            role: z.string().min(1, { message: "Address is required" }).optional(),
            departement: z.string().min(1, { message: "Address is required" }).optional(),
            num_tel: z.number().int().optional(),
            email: z.string().email({ message: "Invalid email format" }).optional(),
            team_id: z.number().int().optional(),
            team: z.string().min(1).optional(),
            ID: z.number().int(),
        });

        const result = staffSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {nom,prenom,num_tel,email,departement,role,team,ID} = req.body;

        if(!ID||[nom,prenom,num_tel,email,departement,role,team].every((value)=>(value===undefined))){
            return res.status(400).json({success:false,message:"missing data"});
        }

        //need to check for predetermened team names
        /*if(team_id&&!Number.isInteger(Number(team_id))){
            return res.status(401).json({success:false,message:"team id must be an integer"});
        }*/

        
        const data = {nom,prenom,num_tel,email,departement,role}

        const FilteredBody = Object.fromEntries(Object.entries(data).filter(([key,value])=>(value!==undefined&&value!==null&&value!=="")));

        const columns = Object.keys(FilteredBody);
        const values = Object.values(FilteredBody);


        let columnsString = (columns.map((column,index)=>`${column}=$${index+1}`)).join(',');
        if(team){
            const teamParamIndex = values.length + 1;
            values.push(team)
            columnsString = `${columnsString},team_id = (SELECT "ID" FROM team WHERE team.nom = $${teamParamIndex})`;
        }

        const idParamIndex = values.length + 1
        values.push(ID);

        const query = `UPDATE staff SET ${columnsString} WHERE "ID"=$${idParamIndex} `;

        

        await pool.query(query,values);

        return res.status(200).json({success : true, message: "staff updated with success"});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

const deleteStaff = async(req,res)=>{
    try {
        const staffSchema = z.object({
            ID: z.number().int().min(1),
        });

        const result = staffSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {ID} = req.body;
        console.log("data received to delete : ",JSON.stringify(req.body));

        const query = 'DELETE FROM staff WHERE "ID"=$1';
        const values = [ID];

        await pool.query(query,values);
        return res.status(200).json({success: true, message : "staff deleted with success"});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

const getAllStaff = async (req,res)=>{
    try {
        const decoded_token = req.decoded_token;

        if(!decoded_token){
            return res.status(400).json({success:false,message:"missing data"});
        }

        const query = 'SELECT staff."ID",staff.nom,staff.prenom,staff.email,staff.departement,staff.num_tel,staff.role,team.nom AS team_nom FROM staff LEFT JOIN team ON staff.team_id = team."ID" WHERE staff.account_id IN (SELECT "ID" FROM accounts WHERE entreprise_id=(SELECT entreprise_id FROM accounts WHERE "ID" = $1))';
        const values = [decoded_token.id];

        const data = await pool.query(query,values);
        if(!data){
            return res.status(400).json({"success":false , message:"failure"});
        }
        return res.status(200).json({success: true, message : "staffs fetched with success",data:data.rows});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}




module.exports = {addStaff,updateStaff,deleteStaff,getAllStaff}