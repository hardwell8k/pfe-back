const pool = require('../../dbConnection');
const {z} = require('zod');

const addTransport = async(req,res)=>{
    try{
        const transportSchema = z.object({
            adress_depart: z.string().min(1, { message: "Departure address is required" }),
            adress_arrive: z.string().min(1, { message: "Arrival address is required" }),
            temps_depart: z.string().refine(val => !isNaN(new Date(val).getTime()), {
                message: "Invalid departure time format"
            }),
            description: z.string().min(1, { message: "Description is required" }),
            prix: z.number().min(0, { message: "Price must be a positive number" }),
            evenement_id: z.number().int().min(1, { message: "Event ID must be a positive number" }),
            car_id: z.number().int().min(1, { message: "Car ID must be a positive number" }).optional(),
            agence_id: z.number().int().min(1, { message: "Agency ID must be a positive number" }).optional(),
            staff_id: z.number().int().min(1, { message: "Staff ID must be a positive number" }).optional()
        });

        const result = transportSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {adress_depart, adress_arrive, temps_depart, description, prix, evenement_id, car_id, agence_id, staff_id} = req.body;

        // Start a transaction
        await pool.query('BEGIN');

        try {
            // Insert into transport table
            const transportQuery = `
                INSERT INTO transport (
                    adress_depart, 
                    adress_arrive, 
                    temps_depart, 
                    description, 
                    prix, 
                    evenement_id, 
                    car_id,
                    agence_id
                ) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
                RETURNING *
            `;
            const transportValues = [adress_depart, adress_arrive, temps_depart, description, prix, evenement_id, car_id, agence_id];

            const transportResult = await pool.query(transportQuery, transportValues);
            const newTransport = transportResult.rows[0];

            // If agence_id is null and staff_id is provided, create transport_staff entry
            if (!agence_id && staff_id) {
                const staffQuery = `
                    INSERT INTO transport_staff (transport_id, staff_id) 
                    VALUES ($1, $2) 
                    RETURNING *
                `;
                const staffValues = [newTransport.ID, staff_id];
                
                const staffResult = await pool.query(staffQuery, staffValues);
                
                // Commit the transaction
                await pool.query('COMMIT');

                return res.status(200).json({
                    success: true, 
                    message: "Transport and staff assignment added successfully",
                    data: {
                        transport: newTransport,
                        staff_assignment: staffResult.rows[0]
                    }
                });
            }

            // If agence_id is provided or staff_id is not provided, just return the transport
            await pool.query('COMMIT');
            return res.status(200).json({
                success: true, 
                message: "Transport added successfully",
                data: newTransport
            });

        } catch (error) {
            // If any error occurs, rollback the transaction
            await pool.query('ROLLBACK');
            throw error;
        }
    }catch(error){
        console.error("Error while adding transport:", error);
        res.status(500).json({
            success: false,
            message: "Error while adding transport",
            err: error.message
        });
    }
}

const updateTransport = async(req,res)=>{
    try{
        const transportSchema = z.object({
            ID: z.number().int().min(1, { message: "Transport ID must be a positive number" }),
            adress_depart: z.string().min(1, { message: "Departure address is required" }).optional(),
            adress_arrive: z.string().min(1, { message: "Arrival address is required" }).optional(),
            temps_depart: z.string().refine(val => !isNaN(new Date(val).getTime()), {
                message: "Invalid departure time format"
            }).optional(),
            description: z.string().min(1, { message: "Description is required" }).optional(),
            prix: z.number().min(0, { message: "Price must be a positive number" }).optional(),
            car_id: z.number().int().min(1, { message: "Car ID must be a positive number" }).optional(),
            agence_id: z.number().int().min(1, { message: "Agency ID must be a positive number" }).optional()
        });

        const result = transportSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {ID, adress_depart, adress_arrive, temps_depart, description, prix, car_id, agence_id} = req.body;

        // Create an object with only the fields that are provided
        const updateData = {
            adress_depart,
            adress_arrive,
            temps_depart,
            description,
            prix,
            car_id,
            agence_id
        };

        // Filter out undefined values
        const filteredData = Object.fromEntries(
            Object.entries(updateData).filter(([_, value]) => value !== undefined)
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
        const query = `
            UPDATE transport 
            SET ${columnsString} 
            WHERE "ID" = $${columns.length + 1} 
            RETURNING *
        `;

        const data = await pool.query(query, values);
        
        if (data.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Transport not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Transport updated successfully",
            data: data.rows[0]
        });
    }catch(error){
        console.error("Error while updating transport:", error);
        res.status(500).json({
            success: false,
            message: "Error while updating transport",
            err: error.message
        });
    }
}

const deleteTransport = async(req,res)=>{
    try{
        const transportSchema = z.object({
            ID: z.string().regex(/^\d+$/, { message: "Transport ID must be a numeric string" }),
        });

        const result = transportSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {ID} = req.body;
        console.log("Transport ID for deletion:", ID);

        // First, delete all staff assignments for this transport
        const deleteStaffQuery = 'DELETE FROM transport_staff WHERE transport_id = $1';
        await pool.query(deleteStaffQuery, [ID]);
        console.log("Deleted staff assignments for transport:", ID);

        // Then delete the transport
        const query = 'DELETE FROM transport WHERE "ID" = $1 RETURNING *';
        const values = [ID];
        console.log("Query:", query);
        console.log("Values:", values);

        const data = await pool.query(query, values);
        console.log("Delete result:", data.rows);

        if (data.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Transport not found" });
        }

        return res.status(200).json({ 
            success: true, 
            message: "Transport deleted successfully", 
            deletedTransport: data.rows[0] 
        });
    }catch(error){
        console.error("Error while deleting transport:", error);
        res.status(500).json({success:false, message:"Error while deleting transport", err:error.message});
    }
}

const addStaffToTransport = async(req,res)=>{
    try{
        const staffSchema = z.object({
            transport_id: z.number().int().min(1, { message: "Transport ID must be a positive number" }),
            staff_id: z.number().int().min(1, { message: "Staff ID must be a positive number" })
        });

        const result = staffSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {transport_id, staff_id} = result.data;

        const decoded_token = req.decoded_token;
        if(!decoded_token) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        // Check if staff is already assigned
        const checkQuery = `
            SELECT * FROM transport_staff 
            WHERE transport_id = $1 AND staff_id = $2
        `;
        const checkResult = await pool.query(checkQuery, [transport_id, staff_id]);
        
        if (checkResult.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Staff is already assigned to this transport"
            });
        }

        const query = `
            INSERT INTO transport_staff (transport_id, staff_id) 
            VALUES ($1, $2) 
            RETURNING *
        `;
        const values = [transport_id, staff_id];

        const data = await pool.query(query, values);
        return res.status(200).json({
            success: true,
            message: "Staff added to transport successfully",
            data: data.rows[0]
        });
    }catch(error){
        console.error("Error while adding staff to transport:", error);
        res.status(500).json({
            success: false,
            message: "Error while adding staff to transport",
            err: error.message
        });
    }
}

const removeStaffFromTransport = async(req,res)=>{
    try{
        const staffSchema = z.object({
            transport_id: z.number().int().min(1, { message: "Transport ID must be a positive number" }),
            staff_id: z.number().int().min(1, { message: "Staff ID must be a positive number" })
        });

        const result = staffSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {transport_id, staff_id} = result.data;

        const decoded_token = req.decoded_token;
        if(!decoded_token) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        const query = `
            DELETE FROM transport_staff 
            WHERE transport_id = $1 AND staff_id = $2 
            RETURNING *
        `;
        const values = [transport_id, staff_id];

        const data = await pool.query(query, values);
        
        if (data.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Staff assignment not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Staff removed from transport successfully",
            data: data.rows[0]
        });
    }catch(error){
        console.error("Error while removing staff from transport:", error);
        res.status(500).json({
            success: false,
            message: "Error while removing staff from transport",
            err: error.message
        });
    }
}

const getAllTransports = async(req,res)=>{
    try{
        const decoded_token = req.decoded_token;
        if(!decoded_token) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        const query = `
            SELECT 
                t."ID",
                t.adress_depart,
                t.adress_arrive,
                t.temps_depart,
                t.description,
                t.prix,
                t.evenement_id,
                t.car_id,
                t.agence_id,
                c.nom as car_name,
                c.matricule as car_matricule,
                a.nom as agence_name,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'staff_id', s."ID",
                            'staff_name', s.nom,
                            'staff_role', s.role
                        )
                    ) FILTER (WHERE s."ID" IS NOT NULL),
                    '[]'
                ) as staff
            FROM transport t
            LEFT JOIN car c ON t.car_id = c."ID"
            LEFT JOIN agence a ON t.agence_id = a."ID"
            LEFT JOIN transport_staff ts ON t."ID" = ts.transport_id
            LEFT JOIN staff s ON ts.staff_id = s."ID"
            WHERE t.evenement_id IN (
                SELECT "ID" 
                FROM evenement 
                WHERE client_id IN (
                    SELECT "ID" 
                    FROM "Clients" 
                    WHERE entreprise_id = (
                        SELECT entreprise_id 
                        FROM accounts 
                        WHERE "ID" = $1
                    )
                )
            )
            GROUP BY t."ID", c.nom, c.matricule, a.nom
        `;
        const values = [decoded_token.id];

        const data = await pool.query(query, values);
        return res.status(200).json({
            success: true,
            message: "Transports fetched successfully",
            data: data.rows
        });
    }catch(error){
        console.error("Error while fetching transports:", error);
        res.status(500).json({
            success: false,
            message: "Error while fetching transports",
            err: error.message
        });
    }
}

const getEventTransport = async(req,res)=>{
    try{
        const eventSchema = z.object({
            ID: z.string().regex(/^\d+$/, { message: "Event ID must be a numeric string" })
        });

        const result = eventSchema.safeParse({ID: req.params.ID});

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {ID} = result.data;
        const decoded_token = req.decoded_token;
        
        if(!decoded_token) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        const query = `
            SELECT 
                t."ID",
                t.adress_depart,
                t.adress_arrive,
                t.temps_depart,
                t.description,
                t.prix,
                t.evenement_id,
                t.car_id,
                t.agence_id,
                c.nom as car_name,
                c.matricule as car_matricule,
                c.nbr_place as car_capacity,
                a.nom as agence_name,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'staff_id', s."ID",
                            'staff_name', s.nom,
                            'staff_role', s.role
                        )
                    ) FILTER (WHERE s."ID" IS NOT NULL),
                    '[]'
                ) as staff
            FROM transport t
            LEFT JOIN car c ON t.car_id = c."ID"
            LEFT JOIN agence a ON t.agence_id = a."ID"
            LEFT JOIN transport_staff ts ON t."ID" = ts.transport_id
            LEFT JOIN staff s ON ts.staff_id = s."ID"
            JOIN evenement e ON t.evenement_id = e."ID"
            WHERE e."ID" = $1
            AND e.client_id IN (
                SELECT "ID" 
                FROM "Clients" 
                WHERE entreprise_id = (
                    SELECT entreprise_id 
                    FROM accounts 
                    WHERE "ID" = $2
                )
            )
            GROUP BY t."ID", c.nom, c.matricule, c.nbr_place, a.nom
        `;
        const values = [ID, decoded_token.id];

        const data = await pool.query(query, values);
        return res.status(200).json({
            success: true,
            message: "Event transports fetched successfully",
            data: data.rows
        });
    }catch(error){
        console.error("Error while fetching event transports:", error);
        res.status(500).json({
            success: false,
            message: "Error while fetching event transports",
            err: error.message
        });
    }
}

const addTransportStaff = async(req,res)=>{
    try{
        console.log('Received request to add transport staff:', req.body);

        const staffSchema = z.object({
            transport_id: z.number().int().min(1, { message: "Transport ID must be a positive number" }),
            staff_id: z.number().int().min(1, { message: "Staff ID must be a positive number" })
        });

        const result = staffSchema.safeParse(req.body);
        console.log('Validation result:', result);

        if (!result.success) {
            console.log('Validation failed:', result.error.errors);
            return res.status(400).json({ errors: result.error.errors });
        }

        const {transport_id, staff_id} = result.data;
        console.log('Validated data:', { transport_id, staff_id });

        // Check if staff is already assigned
        const checkQuery = `
            SELECT * FROM transport_staff 
            WHERE transport_id = $1 AND staff_id = $2
        `;
        console.log('Checking for existing assignment with query:', checkQuery);
        console.log('Query parameters:', [transport_id, staff_id]);

        const checkResult = await pool.query(checkQuery, [transport_id, staff_id]);
        console.log('Check result:', checkResult.rows);
        
        if (checkResult.rows.length > 0) {
            console.log('Staff already assigned to transport');
            return res.status(400).json({
                success: false,
                message: "Staff is already assigned to this transport"
            });
        }

        const query = `
            INSERT INTO transport_staff (
                transport_id, 
                staff_id
            ) 
            VALUES ($1, $2) 
            RETURNING *
        `;
        console.log('Insert query:', query);
        console.log('Insert parameters:', [transport_id, staff_id]);

        const data = await pool.query(query, [transport_id, staff_id]);
        console.log('Insert result:', data.rows[0]);

        return res.status(200).json({
            success: true,
            message: "Staff added to transport successfully",
            data: data.rows[0]
        });
    }catch(error){
        console.error("Error while adding staff to transport:", error);
        console.error("Error stack:", error.stack);
        res.status(500).json({
            success: false,
            message: "Error while adding staff to transport",
            err: error.message
        });
    }
}

module.exports = {
    addTransport,
    updateTransport,
    deleteTransport,
    getAllTransports,
    getEventTransport,
    addStaffToTransport,
    removeStaffFromTransport,
    addTransportStaff
}