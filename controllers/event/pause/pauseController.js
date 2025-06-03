const pool = require('../../../dbConnection');
const {z} = require('zod');

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;

const addPause = async(req,res)=>{
    try{
        const pauseSchema = z.object({
            name: z.string().min(1, { message: "address is required" }),
            start_time: z.string().regex(timeRegex, { message: "Start time must be in HH:mm or HH:mm:ss format" }),
            end_time: z.string().regex(timeRegex, { message: "End time must be in HH:mm or HH:mm:ss format" }),
            price_per_person: z.number(),
            evenement_id: z.number().int(),
            description: z.string().min(1, { message: "categorie is required" }),
        });

        const result = pauseSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {name,start_time,end_time,price_per_person,description,evenement_id} = req.body;

        const query = 'INSERT INTO pause (name,start_time,end_time,price_per_person,description,evenement_id) VALUES ($1,$2,$3,$4,$5,$6)';
        const values = [name,start_time,end_time,price_per_person,description,evenement_id];

        await pool.query(query,values);
        return res.status(200).json({success:true , message:"break added with success"});
    }catch(error){
        console.error("error while deleting the events",error);
        res.status(500).json({success:false,message:"error while adding the break",err:error.message});
    }
}

const updatePause = async(req,res)=>{
    try{
        const pauseSchema = z.object({
            name: z.string().min(1, { message: "name is required" }).optional(),
            start_time: z.string().regex(timeRegex, { message: "Start time must be in HH:mm or HH:mm:ss format" }).optional(),
            end_time: z.string().regex(timeRegex, { message: "End time must be in HH:mm or HH:mm:ss format" }).optional(),
            price_per_person: z.number().optional(),
            description: z.string().min(1, { message: "description is required" }).optional(),
            ID: z.number(1),
        });

        const result = pauseSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }


        const {name,start_time,end_time,price_per_person,description,ID} = req.body;
        if(!name&&!start_time&&!end_time&&!price_per_person&&!description){
            return res.status(400).json({ success:false, message:"missing data"});
        }

        const data = {name,start_time,end_time,price_per_person,description}

        const FilteredBody = Object.fromEntries(Object.entries(data).filter(([key,value])=>(value!==undefined&&value!==null&&value!=="")));

        const columns = Object.keys(FilteredBody);
        const values = Object.values(FilteredBody);

        values.push(ID);

        const columnsString = (columns.map((column,index)=>`${column}=$${index+1}`)).join(',');
        const query = `UPDATE pause SET ${columnsString} WHERE "ID"=$${columns.length+1} `;

        await pool.query(query,values);
        return res.status(200).json({success:true , message:"break updated with success"});
    }catch(error){
        console.error("error while deleting the events",error);
        res.status(500).json({success:false,message:"error while adding the break",err:error.message});
    }
}

const deletePause = async(req,res)=>{
    try{
        const pauseSchema = z.object({
            ID: z.string().regex(/^\d+$/, { message: "Pause ID must be a numeric string" }),          
        });

        const result = pauseSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const { ID } = req.body;
        console.log("Pause ID from body:", ID);
        console.log("Pause ID type:", typeof ID);

        const query = 'DELETE FROM pause WHERE "ID" = $1 RETURNING *';
        const values = [ID];
        console.log("Query:", query);
        console.log("Values:", values);

        const data = await pool.query(query, values);
        console.log("Delete result:", data.rows);

        if (data.rows.length === 0) {
            return res.status(404).json({ success: false, message: "No pause found with the provided ID" });
        }

        return res.status(200).json({ success: true, message: "Break deleted successfully", deletedPause: data.rows[0] });
    }catch(error){
        console.error("Error while deleting pause:", error);
        res.status(500).json({ success: false, message: "Error while deleting the break", err: error.message });
    }
}

const getAllPausesForEvent = async(req,res)=>{
    try{
        const eventId = req.params.ID;
        console.log("Raw Event ID from params:", eventId);

        const pauseSchema = z.object({
            evenement_id: z.string().regex(/^\d+$/, { message: "Event ID must be a numeric string" }),
        });

<<<<<<< HEAD
        const result = pauseSchema.safeParse({evenement_id: eventId});
=======
        const result = pauseSchema.safeParse({evenement_id:Number(req.params.ID)});
>>>>>>> d7b76794ca2a7142804c65e7ac124ec1ae892bbb

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }
        
        console.log("Event ID after validation:", eventId);
        console.log("Event ID type:", typeof eventId);

<<<<<<< HEAD
        const query = 'SELECT "ID", name, start_time, end_time, price_per_person, description, evenement_id FROM pause WHERE evenement_id = $1';
        const values = [eventId];
        console.log("Query:", query);
        console.log("Values:", values);
=======
        const query = 'SELECT * FROM pause WHERE evenement_id = $1';
        const values = [evenement_id];
>>>>>>> d7b76794ca2a7142804c65e7ac124ec1ae892bbb

        const data = await pool.query(query,values);
        console.log("Query result structure:", data.rows.map(row => ({
            id: row.ID,
            name: row.name,
            start_time: row.start_time,
            end_time: row.end_time,
            price_per_person: row.price_per_person,
            description: row.description,
            evenement_id: row.evenement_id
        })));
        
        return res.status(200).json({
            success: true, 
            message: "breaks fetched successfully",
            data: data.rows.map(row => ({
                id: row.ID,
                name: row.name,
                start_time: row.start_time,
                end_time: row.end_time,
                price_per_person: row.price_per_person,
                description: row.description,
                evenement_id: row.evenement_id
            }))
        });
    }catch(error){
        console.error("Error while fetching pauses:", error);
        res.status(500).json({success:false, message:"Error while fetching pauses", err:error.message});
    }
}

module.exports = {addPause,updatePause,deletePause,getAllPausesForEvent}