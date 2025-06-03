const pool = require('../../dbConnection');

const {z} = require('zod');

const addEquipment = async(req,res)=>{
    try {
        const equipmentSchema = z.object({
            nom: z.string().trim().min(1, { message: "Nom is required" }),
            sub_category: z.number().int(),
            category: z.number().int(),
            prix: z.number(),
            type: z.string().min(1, { message: "type is required" }),
            code_bar: z.string().min(1).optional(),
            RFID: z.string().min(1).optional(),
            details: z.string().min(1).optional(),
            date_achat: z.string().refine(val => !isNaN(new Date(val).getTime()), {
                message: "Invalid date format"
            }).optional(),
            date_location: z.string().refine(val => !isNaN(new Date(val).getTime()), {
                message: "Invalid date format"
            }).optional(),
            date_retour: z.string().refine(val => !isNaN(new Date(val).getTime()), {
                message: "Invalid date format"
            }).optional(),
            quantite: z.number().int(),
        });

        const result = equipmentSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        console.log(JSON.stringify(result.data,null,2))

        const {nom,code_bar,RFID,details,sub_category,category,type,date_achat,date_location,date_retour,quantite,prix} = result.data;
        const decoded_token = req.decoded_token;
        
        if(!decoded_token.id||!decoded_token.role){
            return res.status(400).json({ message:"missing data" });
        }

        if((type==="loue"&&(!date_location||!date_retour))||(type==="achete"&&!date_achat)){
            return res.status(400).json({ message:"missing data" });
        }

        const acceptedroles=["super_admin","admin","super_user"];
        if(!acceptedroles.includes(decoded_token.role)){
            return res.status(403).json({success : false, message: "missing privilege"});
        }

        const values = [];
        const placeholders = [];
        let idx =0;
        for (let i = 0; i < quantite; i++) {
            
            placeholders.push(`($${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4}, $${idx + 5}, 
                                (SELECT entreprise_id FROM accounts WHERE "ID" = $${idx + 6}), 
                                $${idx + 7}, $${idx + 8}, $${idx + 9}, $${idx + 10},$${idx + 11},$${idx + 12})`);

            values.push(nom, code_bar, RFID, details, sub_category,decoded_token.id, category, type, date_achat, date_location, date_retour,prix);
            dx = idx+12;
        }
        console.log("placeHolders: ",placeholders)
        console.log("Values: ",values);

        const query = `
            INSERT INTO equipement (nom, code_bar, "RFID", details, sub_category_id, entreprise_id ,category_id,type, date_achat, date_location, date_retour,prix)
            VALUES ${placeholders.join(", ")};
        `;

        console.log("query: ",query);


        //const query = 'INSERT INTO equipement (nom,code_bar,"RFID",details,sub_category_id,category_id,type,date_achat,date_location,date_retour) VALUES ($1,$2,$3,$4,$5,(SELECT entreprise_id FROM accounts WHERE "ID" = $6),$7)';
        const {rowCount} = await pool.query(query,values);

        if(rowCount === 0){
            return res.status(400).json({"success":false , message:"failure"});
        }

        return res.status(200).json({success : true, message: "equipment added with success"});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

const getAllEquipment = async(req,res)=>{
    try {
        const equipmentSchema = z.object({
            timestamp: z.string().refine((value) => {
                const date = new Date(value);
                return !isNaN(date.getTime());
            }, {
                message: "Invalid timestamp format",
            }),
        });

        const result = equipmentSchema.safeParse({timestamp:req.params.timestamp});

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {timestamp} = result.data;

        const decoded_token = req.decoded_token;
        if(!decoded_token){
            return res.status(401).json({success:false,message:"missing data"});
        }

        const query = `SELECT e."ID", e.nom, e.code_bar, e."RFID", e.details,e.type, s."ID" AS sub_category_id ,s.nom AS sub_category_name, c."ID" AS category_id ,c.nom AS category_name, e.date_achat AS date, e.date_retour, e.prix, ag.nom AS agence_nom, ag.num_tel AS agence_num_tel, ag.email AS agence_email, ag.address AS agence_address,le."ID" AS le_id,CASE WHEN le."ID" IS NULL THEN TRUE ELSE FALSE END AS disponible
                        FROM equipement e
                        LEFT JOIN sub_category s ON e.sub_category_id = s."ID"
                        LEFT JOIN category c ON e.category_id = c."ID"
                        LEFT JOIN agence ag ON e.agence_id = ag."ID"
                        LEFT JOIN "Liste_equipement" le ON e."ID" = le.equipement_id AND NOT $1 BETWEEN le.date_debut AND le.date_fin
                        WHERE e.entreprise_id = (SELECT entreprise_id FROM accounts WHERE "ID" = $2)`;

        const values = [timestamp,decoded_token.id];

        const data = await pool.query(query,values);

        return res.status(200).json({success : true, message: "equipment selected with success",data:data.rows});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

const updateEquipment = async(req,res)=>{
    try {
        const equipmentSchema = z.object({
            nom: z.string().trim().min(1, { message: "Nom is required" }).optional(),
            sub_category_id: z.number().int().optional().nullable(),
            category_id: z.number().int().optional(),
            prix: z.number().optional(),
            type: z.string().min(1, { message: "type is required" }).optional(),
            code_bar: z.string().min(1).optional(),
            RFID: z.string().min(1).optional(),
            details: z.string().min(1).optional(),
            date_achat: z.string().refine(val => !isNaN(new Date(val).getTime()), {
                message: "Invalid date format"
            }).optional(),
            date_location: z.string().refine(val => !isNaN(new Date(val).getTime()), {
                message: "Invalid date format"
            }).optional(),
            date_retour: z.string().refine(val => !isNaN(new Date(val).getTime()), {
                message: "Invalid date format"
            }).optional(),
            IDs: z.array(z.number().int()).min(1),
            quantite: z.number().int().min(1),
        });

        const result = equipmentSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        console.log(JSON.stringify(result.data));

        const {IDs,nom,sub_category_id,category_id,type,code_bar,RFID,details,quantite,prix,date_achat,date_location,date_retour} = result.data;
        if(!IDs||([nom,sub_category_id,category_id,type,code_bar,RFID,details,prix,date_achat,date_location,date_retour].every((value)=>(value===undefined||value==="")))){
            return res.status(400).json({success:false,message:"missing data"});
        }

        let IDsToUpdate = [];
        if(quantite>IDs.length){
            IDsToUpdate=IDs
        }else if(quantite>0){
            IDsToUpdate = IDs.slice(0,quantite)
        }


        const data = {nom,sub_category_id,category_id,type,code_bar,RFID,details,prix,date_achat,date_location,date_retour}

        const FilteredBody = Object.fromEntries(Object.entries(data).filter(([key,value])=>(value!==undefined&&value!==null&&value!=="")));

        const columns = Object.keys(FilteredBody);
        const values = Object.values(FilteredBody);

        values.push(IDsToUpdate);

        const columnsString = (columns.map((column,index)=>`${column}=$${index+1}`)).join(',');
        const query = `UPDATE equipement SET ${columnsString} WHERE "ID" = ANY($${columns.length+1})`;


        const {rowCount} = await pool.query(query,values);

        if(rowCount === 0){
            return res.status(400).json({"success":false , message:"no equipment where updated"});
        }

        return res.status(200).json({success : true, message: "equipment updated with success"});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

const deleteEquipment = async(req,res)=>{
    try {
        const equipmentSchema = z.object({
            IDs: z.array(z.number().int()).min(1),
            nbr : z.number().int().min(1),
        });

        const result = equipmentSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {IDs,nbr} = result.data;

        let IDsToDelete = [];
        if(nbr>IDs.length){
            IDsToDelete=IDs
        }else if(nbr>0){
            IDsToDelete = IDs.slice(0,nbr)
        }

        const query = 'DELETE FROM equipement WHERE "ID"=ANY($1)';
        const values = [IDsToDelete];

        const {rowCount} = await pool.query(query,values);

        if(rowCount === 0){
            return res.status(400).json({"success":false , message:"no equipment where deleted"});
        }

        return res.status(200).json({success: true, message : "equipement deleted with success"});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

const getDisponibility = async(req,res)=>{
    try {
        const equipmentSchema = z.object({
            timestamp: z.string().refine((value) => {
                const date = new Date(value);
                return !isNaN(date.getTime());
            }, {
                message: "Invalid timestamp format",
            }),
        });

        const result = equipmentSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const decoded_token = req.decoded_token;

        const {timestamp} = result.data;

        const query = 'SELECT e."ID"';
        const values = [timestamp,decoded_token.id];
        
        const data = await pool.query(query,values);
        return res.status(200).json({success : true, message: "fetched data with success",data:data.rows});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}


const addequipmentType = async()=>{
    try {
        const {type_nom,id_achete,id_loue} = req.body;
        if(!id_achete&&!id_loue){
            return res.status(400).json({success:false,message:"missing data"});
        }

        const query = 'INSERT INTO type (type_nom,id_achete,id_loue) VALUES ($1,$2,$3)';
        const values = [type_nom,id_achete,id_loue];

        await pool.query(query,values);

        return res.status(200).json({success : true, message: "equipment added with success"});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

//add a controller for the graph data
//select from list_equipement join equipementon equipement_id = e."ID" "number of rows for each equipment is the data i need"
//controller for the use graph data in the equipment page 
const getEquipmentUse = async(req,res)=>{
    try {
        const equipmentSchema = z.object({
            timestamp: z.string().refine((value) => {
                const date = new Date(value);
                return !isNaN(date.getTime());
            }, {
                message: "Invalid timestamp format",
            }),
        });

        const result = equipmentSchema.safeParse({timestamp:req.params.timestamp});

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const decoded_token = req.decoded_token;

        const {timestamp} = result.data;

        const endDate = new Date(timestamp);
        const startDate = new Date(endDate);
        startDate.setMonth(endDate.getMonth() - 11);

        const query = `SELECT e.nom,e.details,(SELECT nom FROM sub_category WHERE "ID"=e.sub_category_id) AS sub_category_name,count(*) AS use_number
                        FROM equipement e
                        JOIN "Liste_equipement" le ON le.equipement_id = e."ID"
                        WHERE e.entreprise_id = (SELECT entreprise_id FROM accounts WHERE "ID"=$1)
                        AND le.date_debut BETWEEN $2 AND $3
                        GROUP BY e.nom,details,e.sub_category_id`;
        const values = [decoded_token.id,startDate,endDate];
        
        const data = await pool.query(query,values);
        return res.status(200).json({success : true, message: "fetched data with success",data:data.rows});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}
//controller for the use by category graph in the equipment page
const getCategoryUse = async(req,res)=>{
    try {
        const equipmentSchema = z.object({
            timestamp: z.string().refine((value) => {
                const date = new Date(value);
                return !isNaN(date.getTime());
            }, {
                message: "Invalid timestamp format",
            }),
        });

        const result = equipmentSchema.safeParse({timestamp:req.params.timestamp});

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const decoded_token = req.decoded_token;

        const {timestamp} = result.data;

        const endDate = new Date(timestamp);
        const startDate = new Date(endDate);
        startDate.setMonth(endDate.getMonth() - 11);

        const query = `SELECT (SELECT nom FROM category WHERE "ID"=e.category_id) AS nom,count(*) AS use_number
                        FROM equipement e
                        JOIN "Liste_equipement" le ON le.equipement_id = e."ID"
                        WHERE e.entreprise_id = (SELECT entreprise_id FROM accounts WHERE "ID"=$1)
                        AND le.date_debut BETWEEN $2 AND $3
                        GROUP BY e.category_id`;
        const values = [decoded_token.id,startDate,endDate];
        
        const data = await pool.query(query,values);
        return res.status(200).json({success : true, message: "fetched data with success",data:data.rows});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}
//data for the equipment history page
const getHistoryEquipment = async(req,res)=>{
    try {
        const equipmentSchema = z.object({
            timestamp: z.string().refine((value) => {
                const date = new Date(value);
                return !isNaN(date.getTime());
            }, {
                message: "Invalid timestamp format",
            }),
        });

        const result = equipmentSchema.safeParse({timestamp:req.params.timestamp});

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const decoded_token = req.decoded_token;

        const {timestamp} = result.data;

        const query = `SELECT e.nom AS equipment_name,e.type,count(*) AS use_number,ev.date_debut,ev.date_fin,ev.nom AS event_name
                        FROM equipement e
                        JOIN "Liste_equipement" le ON le.equipement_id = e."ID"
                        JOIN evenement ev ON le.evenement_id = ev."ID"
                        WHERE e.entreprise_id = (SELECT entreprise_id FROM accounts WHERE "ID"=$1)
                        AND ev.date_fin < $2
                        GROUP BY ev.date_debut,ev.date_fin,ev.nom,e.nom`;
        const values = [decoded_token.id,timestamp];
        
        const data = await pool.query(query,values);
        return res.status(200).json({success : true, message: "fetched data with success",data:data.rows});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

    
const getEventEquipment = async(req,res)=>{
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

        const query = `SELECT eq.nom as equipment_name, eq.details, eq.type, ca.nom AS category_name, sc.nom AS sub_category_name ,count(*) AS use_number
                        FROM equipement eq
                        JOIN "Liste_equipement" le ON le.equipement_id = eq."ID" 
                        LEFT JOIN category ca ON eq.category_id = ca."ID"
                        LEFT JOIN sub_category sc ON eq.sub_category_id = sc."ID"
                        WHERE le.evenement_id = $1
                        AND eq.entreprise_id=(SELECT entreprise_id FROM accounts WHERE "ID" = $2) 
                        GROUP BY eq.nom,eq.details,eq.type,ca.nom,sc.nom`;
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

const getAvailabeEventEquipment = async(req,res)=>{
    try{
        const equipmentSchema = z.object({
            start_date: z.string().refine((value) => {
                const date = new Date(value);
                return !isNaN(date.getTime());
            }, {
                message: "Invalid timestamp format",
            }),
            end_date: z.string().refine((value) => {
                const date = new Date(value);
                return !isNaN(date.getTime());
            }, {
                message: "Invalid timestamp format",
            }),
        });

        const result = equipmentSchema.safeParse({start_date:params.start_date,end_date:params.end_date});

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {start_date,end_date} = result.data;

        const decoded_token = req.decoded_token;
        if(!decoded_token){
            return res.status(400).json({success:false,message:"missing data"});
        }

        const query = `SELECT eq."ID", eq.nom, eq.code_bar, eq."RFID", eq.details,eq.type, s."ID" AS sub_category_id ,s.nom AS sub_category_name, c."ID" AS category_id ,c.nom AS category_name, eq.date_achat AS date, eq.date_retour, eq.prix, ag.nom AS agence_nom, ag.num_tel AS agence_num_tel, ag.email AS agence_email, ag.address AS agence_address,CASE WHEN ev."ID" IS NULL THEN TRUE ELSE FALSE END AS disponible
                        FROM equipement eq
                        JOIN "Liste_equipement" le ON le.equipement_id = eq."ID" 
                        LEFT JOIN category ca ON eq.category_id = ca."ID"
                        LEFT JOIN sub_category sc ON eq.sub_category_id = sc."ID"
                        LEFT JOIN evenement ev ON le.evenement_id = ev."ID" AND (ev.date_debut >= $2 OR ev.date_fin <= $1) 
                        WHERE eq.entreprise_id=(SELECT entreprise_id FROM accounts WHERE "ID" = $3) 
                        GROUP BY eq.nom,eq.details
                        ORDER BY date_debut`;
        const values = [start_date,end_date,decoded_token.id]; 

        const data = await pool.query(query,values);
        if(!data){
            return res.status(400).json({"success":false , message:"failure"});
        }
        res.status(200).json({success:true , message:"success",data:data.rows});
    }catch(error){
        console.error("error while getting the equipment",error);
        res.status(500).json({success:false,message:"error while getting the equipment",err:error.message});
    }
}


const addEquipmentToEvent = async(req,res)=>{
    try{
        const equipmentSchema = z.object({
            ID_event: z.number().int().min(1),
            ID_equipment: z.number().int().min(1),
            
        });

        const result = equipmentSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {ID_event,ID_equipment} = result.data;

        const decoded_token = req.decoded_token;
        if(!decoded_token){
            return res.status(400).json({success:false,message:"missing data"});
        }

        const acceptedroles=["super_admin","admin","super_user"];
        if(!acceptedroles.includes(decoded_token.role)){
            return res.status(403).json({success : false, message: "missing privilege"});
        }

        const query = `INSERT INTO "Liste_equipment" (evenement_id,equipement_id) VALUES ($1,$2) WHERE ((SELECT role FROM accounts WHERE "ID"=$3 ) = ANY($4))`;
        const values = [ID_event,ID_equipment,decoded_token.id,acceptedroles]; 

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


const removeEquipmentFromEvent = async(req,res)=>{
    try{
        const equipmentSchema = z.object({
            ID_event: z.number().int().min(1),
            ID_equipment: z.number().int().min(1), 
        });

        const result = equipmentSchema.safeParse({ID_event:Number(req.params.ID_event),ID_equipment:Number(params.ID_equipment)});

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {ID_event,ID_equipment} = result.data;

        const decoded_token = req.decoded_token;
        if(!decoded_token){
            return res.status(400).json({success:false,message:"missing data"});
        }

        const acceptedroles=["super_admin","admin","super_user"];
        if(!acceptedroles.includes(decoded_token.role)){
            return res.status(403).json({success : false, message: "missing privilege"});
        }

        const query = `DELETE FROM "Liste_equipment" WHERE (evenement_id = $1 AND equipement_id = $2 AND ((SELECT role FROM accounts WHERE "ID"=$3 ) = ANY($4)))`;
        const values = [ID_event,ID_equipment,decoded_token.id,acceptedroles]; 

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




module.exports={addEquipment,updateEquipment,getAllEquipment,deleteEquipment,getEquipmentUse,getCategoryUse,getHistoryEquipment,getEventEquipment,getAvailabeEventEquipment,addEquipmentToEvent,removeEquipmentFromEvent}