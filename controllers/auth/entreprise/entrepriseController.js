const pool = require("../../../dbConnection");
const{z} = require("zod");

const addEntreprise = async(req,res)=>{
    try {
        const entrepriseSchema = z.object({
            nom: z.string().trim().min(1, { message: "Nom is required" }),
        });

        const result = entrepriseSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
          }

        const {nom} = result.data;

        const query = 'INSERT INTO entreprise (nom) VALUES ($1)';
        const values = [nom];

        await pool.query(query,values);

        return res.status(200).json({success : true, message: "entreprise added with success"});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

const updateEntreprise = async(req,res)=>{
    try {
        const entrepriseSchema = z.object({
            nom: z.string().trim().min(1, { message: "Nom is required" }),
            ID: z.number({message:"ID is required"}).int(),
        });

        const result = entrepriseSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {ID,nom} = result.data;

        const query = 'UPDATE entreprise SET nom = $1 WHERE "ID"=$2';
        const values = [nom,ID];

        const response = await pool.query(query,values);

        if (response.rowCount === 0) {
            return res.status(404).json({ success: false, message: "Entreprise not found" });
        }

        return res.status(200).json({success:true , message:"entreprise updated with success"});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

const deleteEntreprise = async(req,res)=>{
    try {
        const entrepriseSchema = z.object({
            ID: z.number({message:"ID is required"}).int(),
        });

        const result = entrepriseSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {ID} = result.data;
        
        const query = 'DELETE FROM entreprise WHERE "ID"=$1';
        const values = [ID];

        await pool.query(query,values);

        return res.status(200).json({success : true, message: "entreprise deleted with success"});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

const getAllEntreprises = async(req,res)=>{
    try {
        
        const query = 'SELECT * FROM entreprise';
        
        const data = await pool.query(query);
        
        if(!data){
            return res.status(400).json({"success":false , message:"failure"});
        }
        return res.status(200).json({success : true, message: "entreprises fetched with success",data:data.rows});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

module.exports = {addEntreprise,updateEntreprise,deleteEntreprise,getAllEntreprises}