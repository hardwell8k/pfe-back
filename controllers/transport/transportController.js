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

const getEventtransport = async(req,res)=>{
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

        const query = `SELECT t.adress_depart, t.adress_arrive, t.temps_depart, t.prix, t.description , c.nbr_place, c.matricule, c.categorie, c.nom AS car_name 
                        FROM transport t
                        JOIN evenement ev ON t.evenement_id = ev."ID"
                        LEFT JOIN car c ON t.car_id = c."ID" 
                        WHERE ev."ID = $1
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

const addStaffToTransport = async(req,res)=>{
    try{
        const StaffSchema = z.object({
            ID_transport: z.number().int().min(1),
            ID_staff: z.number().int().min(1),
            
        });

        const result = StaffSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {ID_transport,ID_staff} = result.data;

        const decoded_token = req.decoded_token;
        if(!decoded_token){
            return res.status(400).json({success:false,message:"missing data"});
        }

        const acceptedroles=["super_admin","admin","super_user"];
        if(!acceptedroles.includes(decoded_token.role)){
            return res.status(403).json({success : false, message: "missing privilege"});
        }

        const query = `INSERT INTO staff_transport (transport_id,staff_id) VALUES ($1,$2) WHERE ((SELECT role FROM accounts WHERE "ID"=$3 ) = ANY($4))`;
        const values = [ID_transport,ID_staff,decoded_token.id,acceptedroles]; 

        const data = await pool.query(query,values);
        if(!data){
            return res.status(400).json({"success":false , message:"failure"});
        }
        res.status(200).json({success:true , message:"success",data:data.rows});
    }catch(error){
        console.error("error while adding staff to transport",error);
        res.status(500).json({success:false,message:"error while adding staff to transport",err:error.message});
    }
}


const removeStaffFromTransport = async(req,res)=>{
    try{
        const StaffSchema = z.object({
            ID_transport: z.number().int().min(1),
            ID_staff: z.number().int().min(1), 
        });

        const result = StaffSchema.safeParse({ID_transport:Number(req.params.ID_transport),ID_staff:Number(params.ID_staff)});

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {ID_transport,ID_staff} = result.data;

        const decoded_token = req.decoded_token;
        if(!decoded_token){
            return res.status(400).json({success:false,message:"missing data"});
        }

        const acceptedroles=["super_admin","admin","super_user"];
        if(!acceptedroles.includes(decoded_token.role)){
            return res.status(403).json({success : false, message: "missing privilege"});
        }

        const query = `DELETE FROM staff_transport WHERE (transport_id = $1 AND staff_id = $2 AND ((SELECT role FROM accounts WHERE "ID"=$3 ) = ANY($4)))`;
        const values = [ID_transport,ID_staff,decoded_token.id,acceptedroles]; 

        const data = await pool.query(query,values);
        if(!data){
            return res.status(400).json({"success":false , message:"failure"});
        }
        res.status(200).json({success:true , message:"success",data:data.rows});
    }catch(error){
        console.error("error while removing staff From transport",error);
        res.status(500).json({success:false,message:"error while removing staff From transport",err:error.message});
    }
}


const addCarToTransport = async(req,res)=>{
    try{
        const StaffSchema = z.object({
            ID_transport: z.number().int().min(1),
            ID_car: z.number().int().min(1),
            
        });

        const result = StaffSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {ID_transport,ID_car} = result.data;

        const decoded_token = req.decoded_token;
        if(!decoded_token){
            return res.status(400).json({success:false,message:"missing data"});
        }

        const acceptedroles=["super_admin","admin","super_user"];
        if(!acceptedroles.includes(decoded_token.role)){
            return res.status(403).json({success : false, message: "missing privilege"});
        }

        const query = `UPDATE transport 
                        SET car_id = $1 
                        WHERE "ID" = $2
                        AND ((SELECT role FROM accounts WHERE "ID"=$3 ) = ANY($4))`;
        const values = [ID_car,ID_transport,decoded_token.id,acceptedroles]; 

        const data = await pool.query(query,values);
        if(!data){
            return res.status(400).json({"success":false , message:"failure"});
        }
        res.status(200).json({success:true , message:"success",data:data.rows});
    }catch(error){
        console.error("error while adding car to transport",error);
        res.status(500).json({success:false,message:"error while adding car to transport",err:error.message});
    }
}


const removeCarFromTransport = async(req,res)=>{
    try{
        const StaffSchema = z.object({
            ID_transport: z.number().int().min(1),
        });

        const result = StaffSchema.safeParse({ID_transport:Number(req.params.ID_transport)});

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {ID_transport} = result.data;

        const decoded_token = req.decoded_token;
        if(!decoded_token){
            return res.status(400).json({success:false,message:"missing data"});
        }

        const acceptedroles=["super_admin","admin","super_user"];
        if(!acceptedroles.includes(decoded_token.role)){
            return res.status(403).json({success : false, message: "missing privilege"});
        }

        const query = `UPDATE transport 
                        SET car_id = NULL 
                        WHERE "ID" = $2
                        AND ((SELECT role FROM accounts WHERE "ID"=$3 ) = ANY($4))`;
        const values = [ID_transport,decoded_token.id,acceptedroles]; 

        const data = await pool.query(query,values);
        if(!data){
            return res.status(400).json({"success":false , message:"failure"});
        }
        res.status(200).json({success:true , message:"success",data:data.rows});
    }catch(error){
        console.error("error while removing car From transport",error);
        res.status(500).json({success:false,message:"error while removing car From transport",err:error.message});
    }
}


module.exports = {addTransport,updateTransport,deleteTransport,getAllTransports,getEventtransport,addStaffToTransport,removeStaffFromTransport,addCarToTransport,removeCarFromTransport}