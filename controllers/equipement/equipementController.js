const pool = require('../../dbConnection');

const {z} = require('zod');

const addEquipment = async(req,res)=>{
    console.log("=== addEquipment START ===");
    try {
        console.log("1. Function entered");
        console.log("2. Request body:", req.body);
        
        const equipmentSchema = z.object({
            nom: z.string().trim().min(1, { message: "Nom is required" }),
            sub_category: z.number().int().min(1, { message: "Sub category is required" }),
            category: z.number().int().min(1, { message: "Category is required" }),
            prix: z.number().min(0, { message: "Price must be a positive number" }),
            type: z.enum(['loue', 'achete'], { 
                errorMap: () => ({ message: "Type must be either 'loue' or 'achete'" })
            }),
            code_bar: z.string().min(1, { message: "Barcode is required" }).optional(),
            RFID: z.string().min(1, { message: "RFID is required" }).optional(),
            details: z.string().min(1, { message: "Details are required" }).optional(),
            date_achat: z.string().refine((val) => {
                if (!val) return true;
                const date = new Date(val);
                return !isNaN(date.getTime());
            }, {
                message: "Invalid purchase date format"
            }).optional(),
            date_location: z.string().refine((val) => {
                if (!val) return true;
                const date = new Date(val);
                return !isNaN(date.getTime());
            }, {
                message: "Invalid rental start date format"
            }).optional(),
            date_retour: z.string().refine((val) => {
                if (!val) return true;
                const date = new Date(val);
                return !isNaN(date.getTime());
            }, {
                message: "Invalid rental end date format"
            }).optional(),
            quantite: z.number().int().min(1, { message: "Quantity must be at least 1" }),
            agence_id: z.number().int().min(1, { message: "Agency ID is required" }).optional()
        });

        const result = equipmentSchema.safeParse(req.body);

        if (!result.success) {
            console.log("3. Validation failed:", JSON.stringify(result.error.errors, null, 2));
            return res.status(400).json({ 
                success: false,
                message: "Invalid request data",
                errors: result.error.errors 
            });
        }

        const {
            nom,
            code_bar,
            RFID,
            details,
            sub_category,
            category,
            type,
            date_achat,
            date_location,
            date_retour,
            quantite,
            prix,
            agence_id
        } = result.data;

        const decoded_token = req.decoded_token;
        console.log("4. Decoded token:", decoded_token);
        
        if(!decoded_token.id || !decoded_token.role){
            console.log("5. Missing token data");
            return res.status(400).json({ 
                success: false,
                message: "Missing authentication data" 
            });
        }

        // Validate dates based on type
        if(type === "loue" && (!date_location || !date_retour)){
            console.log("6. Missing rental dates");
            return res.status(400).json({ 
                success: false,
                message: "Rental start and end dates are required for rented equipment" 
            });
        }

        if(type === "achete" && !date_achat){
            console.log("7. Missing purchase date");
            return res.status(400).json({ 
                success: false,
                message: "Purchase date is required for purchased equipment" 
            });
        }

        const acceptedroles = ["super_admin", "admin", "super_user"];
        if(!acceptedroles.includes(decoded_token.role)){
            console.log("8. Insufficient privileges");
            return res.status(403).json({
                success: false, 
                message: "Insufficient privileges"
            });
        }

        const values = [];
        const placeholders = [];
        let idx = 0;
        
        for (let i = 0; i < quantite; i++) {
            placeholders.push(`($${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4}, $${idx + 5}, 
                (SELECT entreprise_id FROM accounts WHERE "ID" = $${idx + 6}), 
                $${idx + 7}, $${idx + 8}, $${idx + 9}, $${idx + 10}, $${idx + 11}, $${idx + 12}, $${idx + 13}, $${idx + 14})`);

            values.push(
                nom, 
                code_bar || null, 
                RFID || null, 
                details || null, 
                sub_category,
                decoded_token.id, 
                category, 
                type, 
                date_achat || null, 
                date_location || null, 
                date_retour || null,
                prix,
                agence_id || null,
                true // available = true by default
            );
            idx += 14;
        }

        console.log("9. Building query");
        const query = `
            INSERT INTO equipement (
                nom, 
                code_bar, 
                "RFID", 
                details, 
                sub_category_id, 
                entreprise_id,
                category_id,
                type, 
                date_achat, 
                date_location, 
                date_retour,
                prix,
                agence_id,
                available
            )
            VALUES ${placeholders.join(", ")}
            RETURNING *
        `;

        console.log("10. Executing query");
        const { rows } = await pool.query(query, values);
        console.log("11. Query executed successfully");
        console.log("12. Number of rows inserted:", rows.length);

        return res.status(200).json({
            success: true, 
            message: "Equipment added successfully",
            data: rows
        });
    } catch (error) {
        console.error("=== addEquipment ERROR ===");
        console.error("Error details:", {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        return res.status(500).json({
            success: false,
            message: "Error while adding equipment",
            error: error.message
        });
    } finally {
        console.log("=== addEquipment END ===");
    }
}

const getAllEquipment = async(req,res)=>{
    console.log("=== getAllEquipment START ===");
    try {
        console.log("1. Function entered");
        console.log("2. Request object:", {
            method: req.method,
            url: req.url,
            path: req.path,
            headers: req.headers,
            params: req.params,
            query: req.query
        });
        
        const decoded_token = req.decoded_token;
        console.log("3. Decoded token:", decoded_token);
        
        if(!decoded_token){
            console.log("4. No authentication token found");
            return res.status(401).json({success:false, message:"Authentication required"});
        }

        console.log("5. Building query");
        const query = `
            SELECT 
                e."ID", 
                e.nom, 
                e.code_bar, 
                e."RFID", 
                e.details,
                e.type, 
                e.prix,
                e.date_achat,
                e.date_location,
                e.date_retour,
                e.agence_id,
                e.available,
                s."ID" AS sub_category_id,
                s.nom AS sub_category_name, 
                c."ID" AS category_id,
                c.nom AS category_name,
                ag.nom AS agence_nom, 
                ag.num_tel AS agence_num_tel, 
                ag.email AS agence_email, 
                ag.address AS agence_address
            FROM equipement e
            LEFT JOIN sub_category s ON e.sub_category_id = s."ID"
            LEFT JOIN category c ON e.category_id = c."ID"
            LEFT JOIN agence ag ON e.agence_id = ag."ID"
            WHERE e.entreprise_id = (SELECT entreprise_id FROM accounts WHERE "ID" = $1)
        `;

        const values = [decoded_token.id];
        console.log("6. Query values:", values);

        console.log("7. Executing query");
        const data = await pool.query(query, values);
        console.log("8. Query executed successfully");
        console.log("9. Number of rows:", data.rows.length);
        console.log("10. First row sample:", data.rows[0]);

        console.log("11. Sending response");
        return res.status(200).json({
            success: true, 
            message: "Equipment fetched successfully",
            data: data.rows
        });
    } catch (error) {
        console.error("=== getAllEquipment ERROR ===");
        console.error("Error details:", {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        return res.status(500).json({success:false, message:error.message});
    } finally {
        console.log("=== getAllEquipment END ===");
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
            agence_id: z.number().int().optional(),
            available: z.boolean().optional(),
            IDs: z.array(z.number().int()).min(1),
            quantite: z.number().int().min(1),
        });

        const result = equipmentSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {IDs, nom, sub_category_id, category_id, type, code_bar, RFID, details, quantite, prix, date_achat, date_location, date_retour, agence_id, available} = result.data;
        
        if(!IDs || ([nom, sub_category_id, category_id, type, code_bar, RFID, details, prix, date_achat, date_location, date_retour, agence_id, available].every((value) => (value === undefined || value === "")))){
            return res.status(400).json({success:false, message:"missing data"});
        }

        let IDsToUpdate = [];
        if(quantite > IDs.length){
            IDsToUpdate = IDs;
        }else if(quantite > 0){
            IDsToUpdate = IDs.slice(0, quantite);
        }

        const data = {nom, sub_category_id, category_id, type, code_bar, RFID, details, prix, date_achat, date_location, date_retour, agence_id, available};
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
        values.push(IDsToUpdate);

        const columnsString = columns.map((column, index) => `${column} = $${index + 1}`).join(', ');
        const query = `UPDATE equipement SET ${columnsString} WHERE "ID" = ANY($${columns.length + 1}) RETURNING *`;

        const {rowCount} = await pool.query(query, values);

        if(rowCount === 0){
            return res.status(400).json({"success":false, message:"no equipment was updated"});
        }

        return res.status(200).json({success: true, message: "equipment updated with success"});
    } catch (error) {
        console.error("Error while updating equipment:", error);
        return res.status(500).json({success:false, message:error.message});
    }
}

const deleteEquipment = async(req,res)=>{
    try {
        const equipmentSchema = z.object({
            IDs: z.array(z.number().int()).min(1),
            nbr: z.number().int().min(1),
        });

        const result = equipmentSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {IDs, nbr} = result.data;

        let IDsToDelete = [];
        if(nbr > IDs.length){
            IDsToDelete = IDs;
        }else if(nbr > 0){
            IDsToDelete = IDs.slice(0, nbr);
        }

        // First check if equipment exists and belongs to the enterprise
        const checkQuery = `
            SELECT "ID" FROM equipement 
            WHERE "ID" = ANY($1) 
            AND entreprise_id = (SELECT entreprise_id FROM accounts WHERE "ID" = $2)
        `;
        const checkResult = await pool.query(checkQuery, [IDsToDelete, req.decoded_token.id]);
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No equipment found with the provided IDs"
            });
        }

        const query = 'DELETE FROM equipement WHERE "ID" = ANY($1) RETURNING *';
        const values = [IDsToDelete];

        const {rowCount} = await pool.query(query, values);

        if(rowCount === 0){
            return res.status(400).json({"success":false, message:"no equipment was deleted"});
        }

        return res.status(200).json({success: true, message: "equipment deleted with success"});
    } catch (error) {
        console.error("Error while deleting equipment:", error);
        return res.status(500).json({success:false, message:error.message});
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
            ID: z.string().regex(/^\d+$/, { message: "Event ID must be a numeric string" })
        });

        const result = equipmentSchema.safeParse({ID:req.params.ID});

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {ID} = result.data;
        const decoded_token = req.decoded_token;
        
        if(!decoded_token){
            return res.status(401).json({success:false, message:"Authentication required"});
        }

        const query = `
            SELECT 
                eq."ID",
                eq.nom as equipment_name, 
                eq.details, 
                eq.type,
                eq.prix,
                eq.date_achat,
                eq.date_location,
                eq.date_retour,
                eq.agence_id,
                ca."ID" AS category_id,
                ca.nom AS category_name, 
                sc."ID" AS sub_category_id,
                sc.nom AS sub_category_name,
                count(*) AS use_number
            FROM equipement eq
            JOIN "Liste_equipement" le ON le.equipement_id = eq."ID" 
            LEFT JOIN category ca ON eq.category_id = ca."ID"
            LEFT JOIN sub_category sc ON eq.sub_category_id = sc."ID"
            WHERE le.evenement_id = $1
            AND eq.entreprise_id = (SELECT entreprise_id FROM accounts WHERE "ID" = $2)
            GROUP BY 
                eq."ID", eq.nom, eq.details, eq.type, eq.prix,
                eq.date_achat, eq.date_location, eq.date_retour,
                eq.agence_id, ca."ID", ca.nom, sc."ID", sc.nom
            ORDER BY le.date_debut
        `;
        
        const values = [ID, decoded_token.id];
        const data = await pool.query(query, values);

        if(!data.rows.length){
            return res.status(404).json({
                success: false, 
                message: "No equipment found for this event"
            });
        }

        return res.status(200).json({
            success: true, 
            message: "Event equipment fetched successfully",
            data: data.rows
        });
    }catch(error){
        console.error("Error while fetching event equipment:", error);
        return res.status(500).json({
            success: false,
            message: "Error while fetching event equipment",
            err: error.message
        });
    }
}

const getAvailabeEventEquipment = async(req,res)=>{
    try{
        const equipmentSchema = z.object({
            start_date: z.string().refine((value) => {
                const date = new Date(value);
                return !isNaN(date.getTime());
            }, {
                message: "Invalid start date format",
            }),
            end_date: z.string().refine((value) => {
                const date = new Date(value);
                return !isNaN(date.getTime());
            }, {
                message: "Invalid end date format",
            }),
        });

        const result = equipmentSchema.safeParse({
            start_date: req.params.start_date,
            end_date: req.params.end_date
        });

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {start_date, end_date} = result.data;
        const decoded_token = req.decoded_token;
        
        if(!decoded_token){
            return res.status(401).json({success:false, message:"Authentication required"});
        }

        const query = `
            SELECT 
                eq."ID", 
                eq.nom, 
                eq.code_bar, 
                eq."RFID", 
                eq.details,
                eq.type,
                eq.prix,
                eq.date_achat,
                eq.date_location,
                eq.date_retour,
                eq.agence_id,
                s."ID" AS sub_category_id,
                s.nom AS sub_category_name, 
                c."ID" AS category_id,
                c.nom AS category_name,
                ag.nom AS agence_nom, 
                ag.num_tel AS agence_num_tel, 
                ag.email AS agence_email, 
                ag.address AS agence_address,
                CASE WHEN le."ID" IS NULL THEN TRUE ELSE FALSE END AS disponible
            FROM equipement eq
            LEFT JOIN category c ON eq.category_id = c."ID"
            LEFT JOIN sub_category s ON eq.sub_category_id = s."ID"
            LEFT JOIN agence ag ON eq.agence_id = ag."ID"
            LEFT JOIN "Liste_equipement" le ON eq."ID" = le.equipement_id 
                AND (
                    (le.date_debut <= $1 AND le.date_fin >= $1) OR
                    (le.date_debut <= $2 AND le.date_fin >= $2) OR
                    (le.date_debut >= $1 AND le.date_fin <= $2)
                )
            WHERE eq.entreprise_id = (SELECT entreprise_id FROM accounts WHERE "ID" = $3)
            AND (le."ID" IS NULL OR le.evenement_id IS NULL)
            GROUP BY 
                eq."ID", eq.nom, eq.code_bar, eq."RFID", eq.details,
                eq.type, eq.prix, eq.date_achat, eq.date_location,
                eq.date_retour, eq.agence_id, s."ID", s.nom,
                c."ID", c.nom, ag.nom, ag.num_tel, ag.email, ag.address
        `;
        
        const values = [start_date, end_date, decoded_token.id];
        const data = await pool.query(query, values);

        return res.status(200).json({
            success: true, 
            message: "Available equipment fetched successfully",
            data: data.rows
        });
    }catch(error){
        console.error("Error while fetching available equipment:", error);
        return res.status(500).json({
            success: false,
            message: "Error while fetching available equipment",
            err: error.message
        });
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

        const {ID_event, ID_equipment} = result.data;
        const decoded_token = req.decoded_token;
        
        if(!decoded_token){
            return res.status(401).json({success:false, message:"Authentication required"});
        }

        const acceptedroles = ["super_admin", "admin", "super_user"];
        if(!acceptedroles.includes(decoded_token.role)){
            return res.status(403).json({success: false, message: "Insufficient privileges"});
        }

        // Check if equipment exists and belongs to the enterprise
        const checkQuery = `
            SELECT "ID" FROM equipement 
            WHERE "ID" = $1 
            AND entreprise_id = (SELECT entreprise_id FROM accounts WHERE "ID" = $2)
        `;
        const checkResult = await pool.query(checkQuery, [ID_equipment, decoded_token.id]);
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Equipment not found or not accessible"
            });
        }

        const query = `
            INSERT INTO "Liste_equipement" (evenement_id, equipement_id) 
            VALUES ($1, $2) 
            RETURNING *
        `;
        const values = [ID_event, ID_equipment];

        const data = await pool.query(query, values);
        
        return res.status(200).json({
            success: true, 
            message: "Equipment added to event successfully",
            data: data.rows[0]
        });
    }catch(error){
        console.error("Error while adding equipment to event:", error);
        return res.status(500).json({
            success: false,
            message: "Error while adding equipment to event",
            err: error.message
        });
    }
}


const removeEquipmentFromEvent = async(req,res)=>{
    try{
        const equipmentSchema = z.object({
            ID_event: z.number().int().min(1),
            ID_equipment: z.number().int().min(1),
        });

        const result = equipmentSchema.safeParse({
            ID_event: req.params.ID_event,
            ID_equipment: req.params.ID_equipment
        });

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {ID_event, ID_equipment} = result.data;
        const decoded_token = req.decoded_token;
        
        if(!decoded_token){
            return res.status(401).json({success:false, message:"Authentication required"});
        }

        const acceptedroles = ["super_admin", "admin", "super_user"];
        if(!acceptedroles.includes(decoded_token.role)){
            return res.status(403).json({success: false, message: "Insufficient privileges"});
        }

        const query = `
            DELETE FROM "Liste_equipement" 
            WHERE evenement_id = $1 
            AND equipement_id = $2 
            RETURNING *
        `;
        const values = [ID_event, ID_equipment];

        const data = await pool.query(query, values);
        
        if (data.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Equipment assignment not found"
            });
        }

        return res.status(200).json({
            success: true, 
            message: "Equipment removed from event successfully",
            data: data.rows[0]
        });
    }catch(error){
        console.error("Error while removing equipment from event:", error);
        return res.status(500).json({
            success: false,
            message: "Error while removing equipment from event",
            err: error.message
        });
    }
}

const getAvailableEquipment = async(req,res)=>{
    try {
        const decoded_token = req.decoded_token;
        
        if(!decoded_token){
            return res.status(401).json({success:false, message:"Authentication required"});
        }

        const query = `
            SELECT 
                e."ID", 
                e.nom, 
                e.code_bar, 
                e."RFID", 
                e.details,
                e.type, 
                e.prix,
                e.date_achat,
                e.date_location,
                e.date_retour,
                e.agence_id,
                e.available,
                s."ID" AS sub_category_id,
                s.nom AS sub_category_name, 
                c."ID" AS category_id,
                c.nom AS category_name,
                ag.nom AS agence_nom, 
                ag.num_tel AS agence_num_tel, 
                ag.email AS agence_email, 
                ag.address AS agence_address
            FROM equipement e
            LEFT JOIN sub_category s ON e.sub_category_id = s."ID"
            LEFT JOIN category c ON e.category_id = c."ID"
            LEFT JOIN agence ag ON e.agence_id = ag."ID"
            WHERE e.available = true
            AND e.agence_id IS NULL
        `;

        const data = await pool.query(query);

        return res.status(200).json({
            success: true, 
            message: "Available equipment fetched successfully",
            data: data.rows
        });
    } catch (error) {
        console.error("Error while fetching available equipment:", error);
        return res.status(500).json({success:false, message:error.message});
    }
}

const getAvailableEquipmentForEvent = async(req,res)=>{
    console.log("=== getAvailableEquipmentForEvent START ===");
    try {
        console.log("1. Function entered");
        const decoded_token = req.decoded_token;
        console.log("2. Decoded token:", decoded_token);
        
        if(!decoded_token){
            console.log("3. No authentication token found");
            return res.status(401).json({success:false, message:"Authentication required"});
        }

        console.log("4. Building query");
        const query = `
            SELECT 
                e."ID", 
                e.nom, 
                e.code_bar, 
                e."RFID", 
                e.details,
                e.type, 
                e.prix,
                e.date_achat,
                e.date_location,
                e.date_retour,
                e.agence_id,
                e.available,
                s."ID" AS sub_category_id,
                s.nom AS sub_category_name, 
                c."ID" AS category_id,
                c.nom AS category_name,
                ag.nom AS agence_nom, 
                ag.num_tel AS agence_num_tel, 
                ag.email AS agence_email, 
                ag.address AS agence_address
            FROM equipement e
            LEFT JOIN sub_category s ON e.sub_category_id = s."ID"
            LEFT JOIN category c ON e.category_id = c."ID"
            LEFT JOIN agence ag ON e.agence_id = ag."ID"
            LEFT JOIN "Liste_equipement" le ON e."ID" = le.equipement_id
            WHERE e.available = true
            AND e.agence_id IS NULL
            AND (le."ID" IS NULL OR le.evenement_id IS NULL)
            GROUP BY 
                e."ID", e.nom, e.code_bar, e."RFID", e.details,
                e.type, e.prix, e.date_achat, e.date_location,
                e.date_retour, e.agence_id, e.available,
                s."ID", s.nom, c."ID", c.nom,
                ag.nom, ag.num_tel, ag.email, ag.address
        `;

        console.log("5. Executing query");
        const data = await pool.query(query);
        console.log("6. Query executed successfully");
        console.log("7. Number of rows:", data.rows.length);
        console.log("8. First row sample:", data.rows[0]);

        console.log("9. Sending response");
        return res.status(200).json({
            success: true, 
            message: "Available equipment fetched successfully",
            data: data.rows
        });
    } catch (error) {
        console.error("=== getAvailableEquipmentForEvent ERROR ===");
        console.error("Error details:", {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        return res.status(500).json({success:false, message:error.message});
    } finally {
        console.log("=== getAvailableEquipmentForEvent END ===");
    }
}

const reserveEquipment = async(req,res)=>{
    console.log("=== reserveEquipment START ===");
    try {
        console.log("1. Function entered");
        console.log("2. Request body:", req.body);
        const decoded_token = req.decoded_token;
        console.log("3. Decoded token:", decoded_token);
        
        if(!decoded_token){
            console.log("4. No authentication token found");
            return res.status(401).json({success:false, message:"Authentication required"});
        }

        const equipmentSchema = z.object({
            equipement_id: z.number().int().min(1),
            evenement_id: z.number().int().min(1),
            date_debut: z.string().refine((value) => {
                const date = new Date(value);
                return !isNaN(date.getTime());
            }, {
                message: "Invalid start date format",
            }),
            date_fin: z.string().refine((value) => {
                const date = new Date(value);
                return !isNaN(date.getTime());
            }, {
                message: "Invalid end date format",
            }),
        });

        console.log("5. Validating request body against schema");
        const result = equipmentSchema.safeParse(req.body);

        if (!result.success) {
            console.log("6. Validation failed:", JSON.stringify(result.error.errors, null, 2));
            return res.status(400).json({ 
                success: false,
                message: "Invalid request data",
                errors: result.error.errors 
            });
        }

        const { equipement_id, evenement_id, date_debut, date_fin } = result.data;
        console.log("7. Validated data:", { equipement_id, evenement_id, date_debut, date_fin });

        // Check if equipment exists and is available
        const checkQuery = `
            SELECT "ID", available 
            FROM equipement 
            WHERE "ID" = $1
        `;
        const checkResult = await pool.query(checkQuery, [equipement_id]);
        
        if (checkResult.rows.length === 0) {
            console.log("8. Equipment not found");
            return res.status(404).json({
                success: false,
                message: "Equipment not found"
            });
        }

        if (!checkResult.rows[0].available) {
            console.log("9. Equipment not available");
            return res.status(400).json({
                success: false,
                message: "Equipment is not available"
            });
        }

        // Check for date conflicts
        const conflictQuery = `
            SELECT "ID" 
            FROM "Liste_equipement" 
            WHERE equipement_id = $1 
            AND (
                (date_debut <= $2 AND date_fin >= $2) OR
                (date_debut <= $3 AND date_fin >= $3) OR
                (date_debut >= $2 AND date_fin <= $3)
            )
        `;
        const conflictResult = await pool.query(conflictQuery, [equipement_id, date_debut, date_fin]);
        
        if (conflictResult.rows.length > 0) {
            console.log("10. Date conflict found");
            return res.status(400).json({
                success: false,
                message: "Equipment is already reserved for these dates"
            });
        }

        // Start transaction
        await pool.query('BEGIN');

        try {
            // Update equipment availability
            const updateQuery = `
                UPDATE equipement 
                SET available = false 
                WHERE "ID" = $1
            `;
            await pool.query(updateQuery, [equipement_id]);

            // Create reservation
            const insertQuery = `
                INSERT INTO "Liste_equipement" 
                (equipement_id, evenement_id, date_debut, date_fin) 
                VALUES ($1, $2, $3, $4) 
                RETURNING *
            `;
            const insertResult = await pool.query(insertQuery, [
                equipement_id, 
                evenement_id, 
                date_debut, 
                date_fin
            ]);

            await pool.query('COMMIT');

            console.log("11. Reservation successful");
            return res.status(200).json({
                success: true,
                message: "Equipment reserved successfully",
                data: insertResult.rows[0]
            });
        } catch (error) {
            await pool.query('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error("=== reserveEquipment ERROR ===");
        console.error("Error details:", {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        return res.status(500).json({
            success: false,
            message: "Error while reserving equipment",
            error: error.message
        });
    } finally {
        console.log("=== reserveEquipment END ===");
    }
}

const getReservedEquipmentForEvent = async(req,res)=>{
    console.log("=== getReservedEquipmentForEvent START ===");
    try {
        console.log("1. Function entered");
        const decoded_token = req.decoded_token;
        console.log("2. Decoded token:", decoded_token);
        
        if(!decoded_token){
            console.log("3. No authentication token found");
            return res.status(401).json({success:false, message:"Authentication required"});
        }

        const eventSchema = z.object({
            ID: z.string().regex(/^\d+$/, { message: "Event ID must be a numeric string" })
        });

        const result = eventSchema.safeParse({ID: req.params.ID});

        if (!result.success) {
            console.log("4. Validation failed:", JSON.stringify(result.error.errors, null, 2));
            return res.status(400).json({ 
                success: false,
                message: "Invalid event ID",
                errors: result.error.errors 
            });
        }

        const { ID } = result.data;
        console.log("5. Event ID:", ID);

        const query = `
            SELECT 
                e."ID", 
                e.nom, 
                e.code_bar, 
                e."RFID", 
                e.details,
                e.type, 
                e.prix,
                e.date_achat,
                e.date_location,
                e.date_retour,
                e.agence_id,
                e.available,
                s."ID" AS sub_category_id,
                s.nom AS sub_category_name, 
                c."ID" AS category_id,
                c.nom AS category_name,
                ag.nom AS agence_nom, 
                ag.num_tel AS agence_num_tel, 
                ag.email AS agence_email, 
                ag.address AS agence_address,
                le.date_debut,
                le.date_fin
            FROM equipement e
            LEFT JOIN sub_category s ON e.sub_category_id = s."ID"
            LEFT JOIN category c ON e.category_id = c."ID"
            LEFT JOIN agence ag ON e.agence_id = ag."ID"
            JOIN "Liste_equipement" le ON e."ID" = le.equipement_id
            WHERE le.evenement_id = $1
            ORDER BY le.date_debut
        `;

        const values = [ID];
        console.log("6. Executing query");
        const data = await pool.query(query, values);
        console.log("7. Query executed successfully");
        console.log("8. Number of rows:", data.rows.length);

        return res.status(200).json({
            success: true, 
            message: "Reserved equipment fetched successfully",
            data: data.rows
        });
    } catch (error) {
        console.error("=== getReservedEquipmentForEvent ERROR ===");
        console.error("Error details:", {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        return res.status(500).json({
            success: false,
            message: "Error while fetching reserved equipment",
            error: error.message
        });
    } finally {
        console.log("=== getReservedEquipmentForEvent END ===");
    }
}

const unreserveEquipment = async(req,res)=>{
    console.log("=== unreserveEquipment START ===");
    try {
        console.log("1. Function entered");
        const decoded_token = req.decoded_token;
        console.log("2. Decoded token:", decoded_token);
        
        if(!decoded_token){
            console.log("3. No authentication token found");
            return res.status(401).json({success:false, message:"Authentication required"});
        }

        const equipmentSchema = z.object({
            equipement_id: z.number().int().min(1),
            evenement_id: z.number().int().min(1)
        });

        const result = equipmentSchema.safeParse(req.body);

        if (!result.success) {
            console.log("4. Validation failed:", JSON.stringify(result.error.errors, null, 2));
            return res.status(400).json({ 
                success: false,
                message: "Invalid request data",
                errors: result.error.errors 
            });
        }

        const { equipement_id, evenement_id } = result.data;
        console.log("5. Request data:", { equipement_id, evenement_id });

        // Start transaction
        await pool.query('BEGIN');

        try {
            // Delete from Liste_equipement
            const deleteQuery = `
                DELETE FROM "Liste_equipement" 
                WHERE equipement_id = $1 
                AND evenement_id = $2 
                RETURNING *
            `;
            const deleteResult = await pool.query(deleteQuery, [equipement_id, evenement_id]);

            if (deleteResult.rows.length === 0) {
                await pool.query('ROLLBACK');
                console.log("6. No reservation found");
                return res.status(404).json({
                    success: false,
                    message: "No reservation found for this equipment and event"
                });
            }

            // Update equipment availability
            const updateQuery = `
                UPDATE equipement 
                SET available = true 
                WHERE "ID" = $1
            `;
            await pool.query(updateQuery, [equipement_id]);

            await pool.query('COMMIT');

            console.log("7. Unreservation successful");
            return res.status(200).json({
                success: true,
                message: "Equipment unreserved successfully",
                data: deleteResult.rows[0]
            });
        } catch (error) {
            await pool.query('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error("=== unreserveEquipment ERROR ===");
        console.error("Error details:", {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        return res.status(500).json({
            success: false,
            message: "Error while unreserving equipment",
            error: error.message
        });
    } finally {
        console.log("=== unreserveEquipment END ===");
    }
}

const getAvailableAgencyEquipment = async(req,res)=>{
    console.log("=== getAvailableAgencyEquipment START ===");
    try {
        console.log("1. Function entered");
        const decoded_token = req.decoded_token;
        console.log("2. Decoded token:", decoded_token);
        
        if(!decoded_token){
            console.log("3. No authentication token found");
            return res.status(401).json({success:false, message:"Authentication required"});
        }

        console.log("4. Building query");
        const query = `
            SELECT 
                e."ID", 
                e.nom, 
                e.code_bar, 
                e."RFID", 
                e.details,
                e.type, 
                e.prix,
                e.date_achat,
                e.date_location,
                e.date_retour,
                e.agence_id,
                e.available,
                s."ID" AS sub_category_id,
                s.nom AS sub_category_name, 
                c."ID" AS category_id,
                c.nom AS category_name,
                ag.nom AS agence_nom, 
                ag.num_tel AS agence_num_tel, 
                ag.email AS agence_email, 
                ag.address AS agence_address
            FROM equipement e
            LEFT JOIN sub_category s ON e.sub_category_id = s."ID"
            LEFT JOIN category c ON e.category_id = c."ID"
            LEFT JOIN agence ag ON e.agence_id = ag."ID"
            WHERE e.available = true
            AND e.agence_id IS NOT NULL
        `;

        console.log("5. Executing query");
        const data = await pool.query(query);
        console.log("6. Query executed successfully");
        console.log("7. Number of rows:", data.rows.length);
        console.log("8. First row sample:", data.rows[0]);

        console.log("9. Sending response");
        return res.status(200).json({
            success: true, 
            message: "Available agency equipment fetched successfully",
            data: data.rows
        });
    } catch (error) {
        console.error("=== getAvailableAgencyEquipment ERROR ===");
        console.error("Error details:", {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        return res.status(500).json({success:false, message:error.message});
    } finally {
        console.log("=== getAvailableAgencyEquipment END ===");
    }
}

module.exports={
    addEquipment,
    updateEquipment,
    getAllEquipment,
    deleteEquipment,
    getEquipmentUse,
    getCategoryUse,
    getHistoryEquipment,
    getEventEquipment,
    getAvailabeEventEquipment,
    addEquipmentToEvent,
    removeEquipmentFromEvent,
    getAvailableEquipment,
    getAvailableEquipmentForEvent,
    reserveEquipment,
    getReservedEquipmentForEvent,
    unreserveEquipment,
    getAvailableAgencyEquipment
}