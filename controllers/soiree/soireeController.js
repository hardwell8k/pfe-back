const pool = require("../../dbConnection");
const {z} = require("zod");

const addSoiree = async(req,res)=>{
    try {
        const soireeSchema = z.object({
            nom: z.string().trim().min(1, { message: "Nom is required" }),
            address: z.string().min(1, { message: "Address is required" }),
            prix: z.number(),
            date: z.string().refine(val => !isNaN(new Date(val).getTime()), {
                message: "Invalid date format"
            }),
            description: z.string().min(1, { message: "Description is required" }),
            evenement_id: z.number().int(),
            max_guests: z.number().int().min(1, { message: "Max guests must be at least 1" }).optional(),
        });

        const result = soireeSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {nom, address, date, prix, evenement_id, description, max_guests = 100} = req.body;
        console.log("Received max_guests:", max_guests);
        
        const query = 'INSERT INTO soire (nom, address, date, description, prix, evenement_id, max_guests) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *';
        const values = [nom, address, date, description, prix, evenement_id, max_guests];

        const data = await pool.query(query, values);
        console.log("Insert result:", data.rows[0]);

        return res.status(200).json({
            success: true, 
            message: "Soiree added successfully",
            data: data.rows[0]
        });
    } catch (error) {
        console.error("Error while adding soiree:", error);
        return res.status(500).json({
            success: false,
            message: "Error while adding the soiree",
            err: error.message
        });
    }
}

const updateSoiree = async(req,res)=>{
    try {
        const soireeSchema = z.object({
            ID: z.string().regex(/^\d+$/, { message: "Soiree ID must be a numeric string" }),
            nom: z.string().trim().min(1, { message: "Nom is required" }).optional(),
            address: z.string().min(1, { message: "Address is required" }).optional(),
            date: z.string().refine(val => !isNaN(new Date(val).getTime()), {
                message: "Invalid date format"
            }).optional(),
            description: z.string().min(1, { message: "Description is required" }).optional(),
            prix: z.number().optional(),
        });

        const result = soireeSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {ID, nom, address, date, description, prix} = req.body;
        
        if(!nom && !address && !date && !description && !prix) {
            return res.status(400).json({ 
                success: false, 
                message: "At least one field must be provided for update" 
            });
        }

        const data = {nom, address, date, description, prix};
        const filteredData = Object.fromEntries(
            Object.entries(data).filter(([_, value]) => value !== undefined && value !== null && value !== "")
        );

        if (Object.keys(filteredData).length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: "No valid fields to update" 
            });
        }

        const columns = Object.keys(filteredData);
        const values = Object.values(filteredData);
        values.push(ID);

        const columnsString = columns.map((column, index) => `${column} = $${index + 1}`).join(', ');
        const query = `UPDATE soire SET ${columnsString} WHERE "ID" = $${columns.length + 1} RETURNING *`;

        const queryResult = await pool.query(query, values);
        console.log("Update result:", queryResult.rows[0]);

        if (queryResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: "No soiree found with the provided ID" 
            });
        }

        return res.status(200).json({
            success: true,
            message: "Soiree updated successfully",
            data: queryResult.rows[0]
        });
    } catch (error) {
        console.error("Error while updating soiree:", error);
        return res.status(500).json({
            success: false,
            message: "Error while updating the soiree",
            err: error.message
        });
    }
}

const deleteSoiree = async(req,res)=>{
    try {
        const soireeSchema = z.object({
            ID: z.string().regex(/^\d+$/, { message: "Soiree ID must be a numeric string" }),
        });

        const result = soireeSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {ID} = req.body;
        console.log("Soiree ID for deletion:", ID);

        const query = 'DELETE FROM soire WHERE "ID" = $1 RETURNING *';
        const values = [ID];

        const data = await pool.query(query, values);
        console.log("Delete result:", data.rows);

        if (data.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: "No soiree found with the provided ID" 
            });
        }

        return res.status(200).json({
            success: true,
            message: "Soiree deleted successfully",
            deletedSoiree: data.rows[0]
        });
    } catch (error) {
        console.error("Error while deleting soiree:", error);
        return res.status(500).json({
            success: false,
            message: "Error while deleting the soiree",
            err: error.message
        });
    }
}

const getAllSoirees = async(req,res)=>{
    try {
        const decoded_token = req.decoded_token;
        if(!decoded_token) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        const query = `
            SELECT 
                s."ID",
                s.nom,
                s.address,
                s.date,
                s.description,
                s.prix,
                s.evenement_id,
                s.max_guests
            FROM soire s
            WHERE s.evenement_id IN (
                SELECT e."ID" 
                FROM evenement e 
                WHERE e.client_id IN (
                    SELECT c."ID" 
                    FROM "Clients" c 
                    WHERE c.entreprise_id = (
                        SELECT a.entreprise_id 
                        FROM accounts a 
                        WHERE a."ID" = $1
                    )
                )
            )
        `;
        const values = [decoded_token.id];

        const data = await pool.query(query, values);
        console.log("Query result count:", data.rows.length);
        console.log("Sample soiree data:", data.rows[0]);

        return res.status(200).json({
            success: true,
            message: "Soirees fetched successfully",
            data: data.rows
        });
    } catch (error) {
        console.error("Error while fetching soirees:", error);
        return res.status(500).json({
            success: false,
            message: "Error while fetching soirees",
            err: error.message
        });
    }
}

const getEventSoiree = async(req,res)=>{
    try{
        const equipmentSchema = z.object({
            ID: z.number().int().min(1),
        });

        const result = equipmentSchema.safeParse({ID:Number(req.params.ID)});

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {ID} = result.data;

        const decoded_token = req.decoded_token;
        if(!decoded_token){
            return res.status(400).json({success:false,message:"missing data"});
        }

        const query = `SELECT so."ID",so.address AS soiree_address , so.date AS soiree_date , so.description AS soiree_description, so.prix AS soiree_price,so.nom, so.max_guests AS soiree_max_guests,so.evenement_id
                        FROM soire so
                        JOIN evenement ev ON so.evenement_id = ev."ID"
                        WHERE so.evenement_id = $1
                        AND ev.client_id = ANY(SELECT "ID" FROM "Clients" WHERE entreprise_id=(SELECT entreprise_id FROM accounts WHERE "ID" = $2))`;
        const values = [ID,decoded_token.id]; 

        const data = await pool.query(query,values);
        if(!data){
            return res.status(400).json({"success":false , message:"failure"});
        }
        res.status(200).json({success:true , message:"success",data:data.rows});
    }catch(error){
        console.error("error while getting the events",error);
        res.status(500).json({success:false,message:"error while getting the events",err:error.message});
    }
}

module.exports = {addSoiree, updateSoiree, deleteSoiree, getAllSoirees, getEventSoiree}