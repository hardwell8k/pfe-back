const pool = require('../../dbConnection');
const {z} = require('zod');

const addTransport = async(req,res)=>{
    try{
        const transportSchema = z.object({
            adress_depart: z.string().min(1, { message: "address is required" }),
            adress_arrive: z.string().min(1, { message: "address is required" }),
            temps_depart:z.string().optional().refine(val => !val || !isNaN(new Date(val).getTime()), {
                message: "Invalid start time format"
            }),
            prix: z.number(),
            evenement_id: z.number().int(),
            car_id: z.number().int().optional(),
            description: z.string().min(1, { message: "categorie is required" }),
        });

        const result = transportSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {adress_depart,adress_arrive,temps_depart,prix,description,evenement_id,car_id} = req.body;

        const query = 'INSERT INTO transport (adress_depart,adress_arrive,temps_depart,prix,description,evenement_id,car_id) VALUES ($1,$2,$3,$4,$5,$6,$7)';
        const values = [adress_depart,adress_arrive,temps_depart,prix,description,evenement_id,car_id];

        await pool.query(query,values);
        return res.status(200).json({success:true , message:"transport added with success"});
    }catch(error){
        console.error("error while deleting the events",error);
        res.status(500).json({success:false,message:"error while adding the car",err:error.message});
    }
}

const updateTransport = async(req,res)=>{
    try{
        const transportSchema = z.object({
            adress_depart: z.string().min(1, { message: "address is required" }).optional(),
            adress_arrive: z.string().min(1, { message: "address is required" }).optional(),
            temps_depart:z.string().optional().refine(val => !val || !isNaN(new Date(val).getTime()), {
                message: "Invalid start time format"
            }),
            prix: z.number().optional(),
            car_id: z.number().int().optional(),
            description: z.string().min(1, { message: "categorie is required" }).optional(),
            ID: z.number().int().min(1),
        });

        const result = transportSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }


        const {adress_depart,adress_arrive,temps_depart,prix,description,car_id,ID} = req.body;
        if(!adress_depart&&!adress_arrive&&!temps_depart&&!prix&&!description&&!car_id){
            return res.status(400).json({ success:false, message:"missing data"});
        }

        const data = {adress_depart,adress_arrive,temps_depart,prix,description,car_id}

        const FilteredBody = Object.fromEntries(Object.entries(data).filter(([key,value])=>(value!==undefined&&value!==null&&value!=="")));

        const columns = Object.keys(FilteredBody);
        const values = Object.values(FilteredBody);

        values.push(ID);

        const columnsString = (columns.map((column,index)=>`${column}=$${index+1}`)).join(',');
        const query = `UPDATE transport SET ${columnsString} WHERE "ID"=$${columns.length+1} `;

        await pool.query(query,values);
        return res.status(200).json({success:true , message:"transport updated with success"});
    }catch(error){
        console.error("error while deleting the events",error);
        res.status(500).json({success:false,message:"error while adding the car",err:error.message});
    }
}

const deleteTransport = async(req,res)=>{
    try{
        const transportSchema = z.object({
            ID: z.number().int(),          
        });

        const result = transportSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {ID} = req.body;

        const query = 'DELETE FROM transport where "ID"=$1';
        const values = [ID];

        await pool.query(query,values);
        return res.status(200).json({success:true , message:"transport deleted with success"});
    }catch(error){
        console.error("error while deleting the events",error);
        res.status(500).json({success:false,message:"error while deleting the car",err:error.message});
    }
}

const getAllTransports = async(req,res)=>{
    try{

        const decoded_token = req.decoded_token;

        if(!decoded_token){
            return res.status(400).json({ success:false, message:"missing data" });
        }

        const query = 'SELECT "ID",adress_depart,adress_arrive,temps_depart,prix,description,(SELECT nom FROM car where car."ID"=t.car_id ) FROM transport t WHERE evenement_id IN (SELECT "ID" FROM evenement WHERE client_id IN (SELECT "ID" FROM "Clients" WHERE entreprise_id = (SELECT entreprise_id from accounts WHERE "ID"=$1)))';
        const values = [decoded_token.id];

        const data = await pool.query(query,values);
        return res.status(200).json({success:true , message:"cars fetched with success",data:data.rows});
    }catch(error){
        console.error("error while deleting the events",error);
        res.status(500).json({success:false,message:"error while fetching the cars",err:error.message});
    }
}

module.exports = {addTransport,updateTransport,deleteTransport,getAllTransports}