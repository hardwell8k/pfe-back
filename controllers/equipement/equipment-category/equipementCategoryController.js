const pool = require('../../../dbConnection');
const {z} = require('zod');

const getCategory = async (req,res)=>{
    try {
        const decoded_token = req.decoded_token;
        if(!decoded_token.id){
            return res.status(400).json({success:false,message:"missing token"});
        }
        
        const query = `SELECT s."ID" AS sub_category_id ,s.nom as sub_category_name,c."ID" AS category_id, c.nom AS category_name
                        FROM sub_category s
                        RIGHT JOIN category c ON s.category_id = c."ID"
                        WHERE c.entreprise_id=(SELECT entreprise_id FROM accounts WHERE "ID" = $1)`;
        const values = [decoded_token.id];
        const data = await pool.query(query,values);
        if(data){
            return res.status(200).json({success:true,data:data.rows});
        }
        return res.status(400).json({success:false,message:"failed in fetching data"});
    } catch (error) {
        console.error("error in get types",error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

const addSubCategory = async(req,res)=>{
    try {
        const categorySchema = z.object({
            nom: z.string().trim().min(1, { message: "Nom is required" }),
            category_id: z.number().int(),
        });

        const result = categorySchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {nom,category_id} = result.data;

        const query = 'INSERT INTO sub_category (nom,category_id) VALUES ($1,$2)';
        const values = [nom,category_id];
        const {rowCount} = await pool.query(query,values);

        if(rowCount === 0){
            return res.status(400).json({"success":false , message:"no subCategory was added"});
        }

        return res.status(200).json({success:true,message:"success"})
    } catch (error) {
        console.error("error while adding sub category ", error.err)
        res.status(505).json({success:false,message:"failed to add a new ub Category",err:error.message})
    }
}

const addCategory = async(req,res)=>{
    try {
        const categorySchema = z.object({
            nom: z.string().trim().min(1, { message: "Nom is required" }),
        });

        const result = categorySchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {nom} = result.data;

        const decoded_token = req.decoded_token;
        if(!decoded_token.id){
            return res.status(400).json({success:false,message:"missing token"});
        }

        const query = 'INSERT INTO category (nom,entreprise_id) VALUES ($1,(SELECT entreprise_id FROM accounts WHERE "ID"=$2))';
        const values = [nom,decoded_token.id];
        const {rowCount} = await pool.query(query,values);
        
        if(rowCount === 0){
            return res.status(400).json({"success":false , message:"no category was added"});
        }

        return res.status(200).json({success:true,message:"success"})
    } catch (error) {
        console.error("error while adding type ", error.err)
        res.status(505).json({success:false,message:"failed to add a new type",err:error.message})
    }
}

const updateSubCategory = async(req,res)=>{
    try {
        const equipmentSchema = z.object({
            nom: z.string().trim().min(1, { message: "Nom is required" }).optional(),
            category_id: z.string().min(1, { message: "category is required" }).optional(),
            ID: z.number().int().min(1),
        });

        const result = equipmentSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {ID,nom,category_id} = result.data;
        if(!ID||([nom,category_id].every((value)=>(value===undefined||value==="")))){
            return res.status(400).json({success:false,message:"missing data"});
        }

        const data = {nom,category_id}

        const FilteredBody = Object.fromEntries(Object.entries(data).filter(([key,value])=>(value!==undefined&&value!==null&&value!=="")));

        const columns = Object.keys(FilteredBody);
        const values = Object.values(FilteredBody);

        values.push(ID);

        const columnsString = (columns.map((column,index)=>`${column}=$${index+1}`)).join(',');
        const query = `UPDATE sub_category SET ${columnsString} WHERE "ID"=$${columns.length+1} `;


        const {rowCount} = await pool.query(query,values);

        if(rowCount === 0){
            return res.status(400).json({"success":false , message:"no sub_category where updated"});
        }

        return res.status(200).json({success : true, message: "sub_category updated with success"});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

const updateCategory = async(req,res)=>{
    try {
        const categorySchema = z.object({
            nom: z.string().trim().min(1, { message: "Nom is required" }).optional(),
            ID: z.number().int().min(1),
        });

        const result = categorySchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {ID,nom} = req.body;
        if(!ID||!nom){
            return res.status(400).json({success:false,message:"missing data"});
        }

        const query = 'UPDATE category SET nom = $1 WHERE "ID" = $2';
        const values = [nom,ID];

        const {rowCount} = await pool.query(query,values);

        if(rowCount === 0){
            return res.status(400).json({"success":false , message:"no equipment where updated"});
        }

        return res.status(200).json({success : true, message: "client added with success"});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

const deleteSubCategory = async(req,res)=>{
    try {
        const categorySchema = z.object({
            ID: z.number().int().min(1),
        });

        const result = categorySchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {ID} = req.body;

        const query = 'DELETE FROM sub_category WHERE "ID"=$1';
        const values = [ID];

        await pool.query(query,values);
        return res.status(200).json({success: true, message : "sub_category deleted with success"});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

const deleteCategory = async(req,res)=>{
    try {
        const categorySchema = z.object({
            ID: z.number().int().min(1),
        });

        const result = categorySchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {ID} = req.body;

        const query = 'DELETE FROM category WHERE "ID"=$1';
        const values = [ID];

        await pool.query(query,values);
        return res.status(200).json({success: true, message : "category deleted with success"});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

module.exports = {getCategory,addCategory,addSubCategory,updateSubCategory,updateCategory,deleteSubCategory,deleteCategory};