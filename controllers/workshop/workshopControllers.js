const pool = require("../../dbConnection");
const {z} = require("zod");

const addWorkshop = async(req,res)=>{
    try {
        const workshopSchema = z.object({
            nom: z.string().trim().min(1, { message: "Nom is required" }),
            categorie: z.string().min(1, { message: "Address is required" }),
            nbr_invite: z.number().int().optional(),
            nbr_max_invite: z.number().int(),
            prix: z.number().int(),
            evenement_id: z.number().int(),
            instructeur_id: z.number().int().optional(),
            temp_debut: z.string().refine(val => !val || !isNaN(new Date(val).getTime()), {
                message: "Invalid activation date format"
            }),
            temp_fin: z.string().refine(val => !val || !isNaN(new Date(val).getTime()), {
                message: "Invalid activation date format"
            }),
        });

        const result = workshopSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {nom,nbr_invite,nbr_max_invite,prix,categorie,evenement_id,instructeur_id,temp_debut,temp_fin} = req.body;

        const query = 'INSERT INTO atelier (nom,nbr_invite,nbr_max_invite,prix,categorie,evenement_id,instructeur_id,temp_debut,temp_fin) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)';
        const values = [nom,nbr_invite,nbr_max_invite,prix,categorie,evenement_id,instructeur_id,temp_debut,temp_fin];

        await pool.query(query,values);

        return res.status(200).json({success : true, message: "workshop added with success"});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

const updateWorkshop = async(req,res)=>{
    try {
        const workshopSchema = z.object({
            nom: z.string().trim().min(1, { message: "Nom is required" }).optional(),
            categorie: z.string().min(1, { message: "categorie is required" }).optional(),
            nbr_invite: z.number().int().optional(),
            nbr_max_invite: z.number().int().optional(),
            prix: z.number().int().optional(),
            evenement_id: z.number().int().optional(),
            instructeur_id: z.number().int().optional(),
            temp_debut: z.string().optional().refine(val => !val || !isNaN(new Date(val).getTime()), {
                message: "Invalid start time format"
            }),
            temp_fin: z.string().optional().refine(val => !val || !isNaN(new Date(val).getTime()), {
                message: "Invalid end time date format"
            }),
        });

        const result = workshopSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }
        
        const {ID,nom,nbr_invite,nbr_max_invite,prix,categorie,evenement_id,instructeur_id,temp_debut,temp_fin} = req.body;
        if(!ID||([nom,nbr_invite,nbr_max_invite,prix,categorie,evenement_id,instructeur_id,temp_debut,temp_fin].every((value)=>(value===undefined||value==="")))){
            return res.status(400).json({success:false,message:"missing data"});
        }

        const data = {nom,nbr_invite,nbr_max_invite,prix,categorie,evenement_id,instructeur_id,temp_debut,temp_fin}

        const FilteredBody = Object.fromEntries(Object.entries(data).filter(([key,value])=>(value!==undefined&&value!==null&&value!=="")));

        const columns = Object.keys(FilteredBody);
        const values = Object.values(FilteredBody);

        values.push(ID);

        const columnsString = (columns.map((column,index)=>`${column}=$${index+1}`)).join(',');
        const query = `UPDATE atelier SET ${columnsString} WHERE "ID"=$${columns.length+1} `;

        console.log("query: ",query);

        await pool.query(query,values);

        return res.status(200).json({success:true , message:"workshop updated with success"});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

const deleteWorkshop = async(req,res)=>{
    try {
        const workshopSchema = z.object({
            id: z.number().int(),
        });

        const result = workshopSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }
        const {ID} = req.body;

        const query = 'DELETE FROM atelier WHERE "ID"=$1';
        const values = [ID];

        await pool.query(query,values);

        return res.status(200).json({success : true, message: "workshop deleted with success"});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

const getAllWorkshops = async(req,res)=>{
    try {
        const workshopSchema = z.object({
            evenement_id: z.number().int(),
        });

        const result = workshopSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }
        const {evenement_id} = req.body;

        const query = 'SELECT nom,nbr_invite,nbr_max_invite,prix,categorie,evenement_id,instructeur_id,temp_debut,temp_fin FROM atelier WHERE evenement_id = $1';
        const values = [evenement_id];

        const data = await pool.query(query,values);
        if(!data){
            return res.status(400).json({"success":false , message:"failure"});
        }
        return res.status(200).json({success : true, message: "client added with success",data:data.rows});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

module.exports = {addWorkshop,updateWorkshop,deleteWorkshop,getAllWorkshops}