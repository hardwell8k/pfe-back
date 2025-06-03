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
        const transportSchema = z.object({
            ID: z.number().int(),          
        });

        const result = transportSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {ID} = req.body;

        const query = 'DELETE FROM pause where "ID"=$1';
        const values = [ID];

        await pool.query(query,values);
        return res.status(200).json({success:true , message:"break deleted with success"});
    }catch(error){
        console.error("error while deleting the events",error);
        res.status(500).json({success:false,message:"error while deleting the break",err:error.message});
    }
}

const getAllPausesForEvent = async(req,res)=>{
    try{

        const pauseSchema = z.object({
            evenement_id: z.number().int(),
        });

        const result = pauseSchema.safeParse({evenement_id:Number(req.params.ID)});

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }
        
        const {evenement_id} = req.body;

        const query = 'SELECT * FROM pause WHERE evenement_id = $1';
        const values = [evenement_id];

        const data = await pool.query(query,values);
        return res.status(200).json({success:true , message:"break fetched with success",data:data.rows});
    }catch(error){
        console.error("error while deleting the events",error);
        res.status(500).json({success:false,message:"error while fetching the break",err:error.message});
    }
}

module.exports = {addPause,updatePause,deletePause,getAllPausesForEvent}