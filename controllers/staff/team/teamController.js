const pool = require("../../../dbConnection");
const jwt = require('jsonwebtoken');

const addTeam = async (req,res)=>{
    try {
        const teamSchema = z.object({
            nom: z.string().trim().min(1, { message: "Nom is required" }),
        });

        const result = teamSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const decoded_token = req.decoded_token ;
        const {nom} = req.body;

        if(!decoded_token){
            return res.status(400).json({success:false,message:"missing data"});
        }

        const query = "INSERT INTO team (nom,account_id) VALUES ($1,$2)";
        const values = [nom,decoded_token.id];

        await pool.query(query,values);

        return res.status(200).json({success : true, message: "team added with success"});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

const updateTeam = async (req,res)=>{
    try {
        const teamSchema = z.object({
            nom: z.string().trim().min(1, { message: "Nom is required" }),
            ID: z.number().int(),
        });

        const result = teamSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }
        
        const {nom,ID} = req.body;

        const query = `UPDATE team SET nom = $1 WHERE "ID"=$2 `;
        const values = [nom,ID]

        await pool.query(query,values);

        return res.status(200).json({success : true, message: "staff updated with success"});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

const deleteTeam = async(req,res)=>{
    try {
        const token = req.cookies ? req.cookies.token : null;
        const {ID} = req.body;

        if(!token||!ID){
            return res.status(400).json({success:false,message:"missing data"});
        }

        if(!Number.isInteger(Number(ID))||Number(ID)<=0){
            return res.status(400).json({ success: false, message: "Invalid ID" });
        }

        const query = 'DELETE FROM team WHERE "ID"=$1';
        const values = [ID];

        await pool.query(query,values);
        return res.status(200).json({success: true, message : "team deleted with success"});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

const getAllTeams = async (req,res)=>{
    try {
        const decoded_token = req.decoded_token;

        if(!decoded_token){
            return res.status(400).json({success:false,message:"missing data"});
        }

        const query = 'SELECT * FROM team WHERE account_id IN (SELECT "ID" FROM accounts WHERE entreprise_id=(SELECT entreprise_id FROM accounts WHERE "ID" = $1))';
        const values = [decoded_token.id];

        const data = await pool.query(query,values);
        if(!data){
            return res.status(400).json({"success":false , message:"failure"});
        }
        return res.status(201).json({success: true, message : "teams fetched with success",data:data.rows});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

const getAllStaffForTeams = async(req,res)=>{
    try {
        const decoded_token = req.decoded_token;

        if(!decoded_token){
            return res.status(400).json({success:false,message:"missing data"});
        }

        const query = 'SELECT * FROM staff WHERE team_id IS NOT NULL AND account_id IN (SELECT "ID" FROM accounts WHERE entreprise_id=(SELECT entreprise_id FROM accounts WHERE "ID" = $1))';
        const values = [decoded_token.id];

        const data = await pool.query(query,values);
        if(!data){
            return res.status(400).json({"success":false , message:"failure"});
        }
        return res.status(201).json({success: true, message : "staff fetched with success",data:data.rows});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}




module.exports = {addTeam,updateTeam,deleteTeam,getAllTeams,getAllStaffForTeams}