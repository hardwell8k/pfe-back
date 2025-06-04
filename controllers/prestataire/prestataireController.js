const { decode } = require("jsonwebtoken");
const pool = require("../../dbConnection");
const {z} = require("zod");


const addPrestataire = async (req, res) => {
    try {
        const prestataireSchema = z.object({
            nom: z.string().trim().min(1, { message: "Nom is required" }),
            type: z.string().min(1, { message: "Type is required" }).optional(),
            num_tel: z.number().int({ message: "num_tel is required and must be an integer" }),
            email: z.string().email({ message: "Invalid email format" }).optional(),
            address: z.string().min(1, { message: "address is required" }).optional(),
        });

        const result = prestataireSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const { nom, address, num_tel , type, email } = result.data;

        const decoded_token = req.decoded_token;
        if(!decoded_token){
            return res.status(400).json({success:false,message:"missing data"});
        }
        

        const query = 'INSERT INTO agence (nom, address, num_tel, type, email, entreprise_id) VALUES ($1, $2, $3, $4, $5, (SELECT entreprise_id FROM accounts WHERE "ID" = $6))';
        const values = [nom, address, num_tel , type, email, decoded_token.id];

        const {rowCount} = await pool.query(query, values);

        if(rowCount === 0){
            return res.status(300).json({success : true, message: "no prestataire was created"});
        }
        return res.status(200).json({ success: true, message: "prestataire added with success" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};


const updatePrestataire = async (req, res) => {
    try {
        const prestataireSchema = z.object({
            nom: z.string().trim().min(1).optional(),
            type: z.string().min(1).optional(),
            num_tel: z.number().int().optional(),
            email: z.string().email().optional(),
            address: z.string().min(1).optional(),
            ID: z.number().int(),
        });

        const result = prestataireSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const { nom, type, num_tel, email, address, ID } = result.data;
        if (!ID || ([nom, type, num_tel, email, address].every((value) => (value === undefined || value === "")))) {
            return res.status(400).json({ success: false, message: "missing data" });
        }

        const data = { nom, type, num_tel, email, address };
        const FilteredBody = Object.fromEntries(Object.entries(data).filter(([_, value]) => (value !== undefined && value !== null && value !== "")));

        const columns = Object.keys(FilteredBody);
        const values = Object.values(FilteredBody);

        values.push(ID);

        const columnsString = (columns.map((column, index) => `${column}=$${index + 1}`)).join(',');
        const query = `UPDATE agence SET ${columnsString} WHERE "ID"=$${columns.length + 1} `;

        const {rowCount} = await pool.query(query, values);
        if(rowCount === 0){
            return res.status(300).json({success : true, message: "no account was updated"});
        }

        return res.status(200).json({ success: true, message: "prestataire updated with success" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};


const deletePrestataire = async (req, res) => {
    try {
        const prestataireSchema = z.object({
            IDs: z.array(z.number().int()).nonempty()
        });

        const result = prestataireSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }
        const { IDs } = req.body;

        const query = 'DELETE FROM agence WHERE "ID" = ANY($1)';
        const values = [IDs];

        const{rowCount} = await pool.query(query, values);
        if(rowCount === 0){
            return res.status(400).json({success : true, message: "no prestataire was deleted"});
        }
        return res.status(200).json({ success: true, message: "prestataire deleted with success" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};


const getAllPrestataires = async (req, res) => {
    try {
        const decoded_token = req.decoded_token;
        if (!decoded_token) {
            return res.status(400).json({ success: false, message: "missing data" });
        }

        const query = 'SELECT "ID", nom, type, num_tel, email, address FROM agence WHERE entreprise_id = (SELECT entreprise_id FROM accounts WHERE "ID" = $1)';
        const values = [decoded_token.id];

        const data = await pool.query(query, values);
        if (!data) {
            return res.status(400).json({ success: false, message: "failure" });
        }
        return res.status(200).json({ success: true, message: "prestataires fetched with success", data: data.rows });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { addPrestataire, updatePrestataire, deletePrestataire, getAllPrestataires };