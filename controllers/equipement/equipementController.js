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
            idx = idx+12;
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

        const result = equipmentSchema.safeParse(req.body);

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
                        LEFT JOIN agence_de_location ag ON e.agence_id = ag."ID"
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

module.exports={addEquipment,updateEquipment,getAllEquipment,deleteEquipment}