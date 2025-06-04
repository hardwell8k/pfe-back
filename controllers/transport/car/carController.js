const pool = require("../../../dbConnection");
const {z} = require("zod");

const addCar = async(req,res)=>{
    try{
        const carSchema = z.object({
            nom: z.string().min(1, { message: "Name is required" }),
            nbr_place: z.number().int().min(1, { message: "Number of seats must be at least 1" }),
            matricule: z.string().min(1, { message: "License plate is required" }),
            categorie: z.string().min(1, { message: "Category is required" }),
            entreprise_id: z.number().int().optional()
        });

        const result = carSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {nom, nbr_place, matricule, categorie, entreprise_id} = req.body;

        const decoded_token = req.decoded_token;
        if(!decoded_token){
            return res.status(401).json({ success:false, message:"Authentication required" });
        }

        // If entreprise_id is not provided, use the one from the authenticated user
        const finalEntrepriseId = entreprise_id || `(SELECT entreprise_id FROM accounts WHERE "ID" = ${decoded_token.id})`;

        const query = `
            INSERT INTO car (nom, nbr_place, matricule, categorie, entreprise_id) 
            VALUES ($1, $2, $3, $4, ${finalEntrepriseId})
            RETURNING *
        `;
        const values = [nom, nbr_place, matricule, categorie];

        const data = await pool.query(query, values);
        return res.status(200).json({
            success: true, 
            message: "Car added successfully",
            data: data.rows[0]
        });
    }catch(error){
        console.error("Error while adding car:", error);
        res.status(500).json({
            success: false,
            message: "Error while adding the car",
            err: error.message
        });
    }
}

const updateCar = async(req,res)=>{
    try{
        const carSchema = z.object({
            ID: z.number().int().min(1, { message: "Car ID is required" }),
            nom: z.string().min(1, { message: "Name is required" }).optional(),
            nbr_place: z.number().int().min(1, { message: "Number of seats must be at least 1" }).optional(),
            matricule: z.string().min(1, { message: "License plate is required" }).optional(),
            categorie: z.string().min(1, { message: "Category is required" }).optional(),
            entreprise_id: z.number().int().optional()
        });

        const result = carSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {ID, nom, nbr_place, matricule, categorie, entreprise_id} = req.body;

        if(!nom && !nbr_place && !matricule && !categorie && !entreprise_id){
            return res.status(400).json({ 
                success: false, 
                message: "At least one field must be provided for update" 
            });
        }

        const data = {nom, nbr_place, matricule, categorie, entreprise_id};
        const filteredData = Object.fromEntries(
            Object.entries(data).filter(([_, value]) => value !== undefined && value !== null && value !== "")
        );

        const columns = Object.keys(filteredData);
        const values = Object.values(filteredData);
        values.push(ID);

        const columnsString = columns.map((column, index) => `${column} = $${index + 1}`).join(', ');
        const query = `
            UPDATE car 
            SET ${columnsString} 
            WHERE "ID" = $${columns.length + 1}
            RETURNING *
        `;

        const queryResult = await pool.query(query, values);

        if (queryResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: "No car found with the provided ID" 
            });
        }

        return res.status(200).json({
            success: true,
            message: "Car updated successfully",
            data: queryResult.rows[0]
        });
    }catch(error){
        console.error("Error while updating car:", error);
        res.status(500).json({
            success: false,
            message: "Error while updating the car",
            err: error.message
        });
    }
}

const deleteCar = async(req,res)=>{
    try{
        const carSchema = z.object({
            ID: z.number().int().min(1, { message: "Car ID is required" })
        });

        const result = carSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {ID} = req.body;

        const query = `
            DELETE FROM car 
            WHERE "ID" = $1
            RETURNING *
        `;
        const values = [ID];

        const data = await pool.query(query, values);

        if (data.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: "No car found with the provided ID" 
            });
        }

        return res.status(200).json({
            success: true,
            message: "Car deleted successfully",
            deletedCar: data.rows[0]
        });
    }catch(error){
        console.error("Error while deleting car:", error);
        res.status(500).json({
            success: false,
            message: "Error while deleting the car",
            err: error.message
        });
    }
}

const getAllCars = async(req,res)=>{
    try{
        const query = `
            SELECT 
                "ID",
                nom,
                nbr_place,
                matricule,
                categorie,
                entreprise_id
            FROM car
        `;

        const data = await pool.query(query);
        return res.status(200).json({
            success: true, 
            message: "Cars fetched successfully",
            data: data.rows
        });
    }catch(error){
        console.error("Error while fetching cars:", error);
        res.status(500).json({
            success: false,
            message: "Error while fetching cars",
            err: error.message
        });
    }
}

const getCarById = async(req,res)=>{
    try{
        const carSchema = z.object({
            ID: z.string().regex(/^\d+$/, { message: "Car ID must be a numeric string" })
        });

        const result = carSchema.safeParse({ID: req.params.ID});

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {ID} = result.data;

        const query = `
            SELECT 
                "ID",
                nom,
                nbr_place,
                matricule,
                categorie,
                entreprise_id
            FROM car 
            WHERE "ID" = $1
        `;
        const values = [ID];

        const data = await pool.query(query, values);

        if (data.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: "No car found with the provided ID" 
            });
        }

        return res.status(200).json({
            success: true,
            message: "Car fetched successfully",
            data: data.rows[0]
        });
    }catch(error){
        console.error("Error while fetching car:", error);
        res.status(500).json({
            success: false,
            message: "Error while fetching car",
            err: error.message
        });
    }
}

module.exports = {
    addCar,
    updateCar,
    deleteCar,
    getAllCars,
    getCarById
};