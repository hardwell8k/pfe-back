const pool = require("../../../dbConnection");
const {z} = require("zod");

const addCar = async(req,res)=>{
    try{
        const carSchema = z.object({
            nom: z.string().min(1, { message: "nom is required" }).optional(),
            matricule: z.string().min(1, { message: "matricule is required" }),
            nbr_place: z.number().int(),
            categorie: z.string().min(1, { message: "categorie is required" }),
        });

        const result = carSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {nom,matricule,nbr_place,categorie} = req.body;

        const decoded_token = req.decoded_token;
        if(!decoded_token){
            return res.status(400).json({ success:false, message:"missing data" });
        }

        const query = 'INSERT INTO car (nom,matricule,nbr_place,categorie,account_id) VALUES ($1,$2,$3,$4,$5)';
        const values = [nom,matricule,nbr_place,categorie,decoded_token.id];

        await pool.query(query,values);
        return res.status(200).json({success:true , message:"car added with success"});
    }catch(error){
        console.error("error while deleting the events",error);
        res.status(500).json({success:false,message:"error while adding the car",err:error.message});
    }
}

const updateCar = async(req,res)=>{
    try{
        const carSchema = z.object({
            nom: z.string().min(1, { message: "nom is required" }).optional(),
            matricule: z.string().min(1, { message: "matricule is required" }).optional(),
            nbr_place: z.number().int().optional(),
            categorie: z.string().min(1, { message: "categorie is required" }).optional(),
            ID: z.number().int().min(1),
        });

        const result = carSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({success:false, errors: result.error.errors });
        }

        const {nom,matricule,nbr_place,categorie,ID} = result.data;
        if(!ID||([nom,matricule,nbr_place,categorie].every((value)=>(value===undefined||value==="")))){
            return res.status(400).json({ success:false, message:"missing data"});
        }

        const data = {nom,matricule,nbr_place,categorie}

        const FilteredBody = Object.fromEntries(Object.entries(data).filter(([key,value])=>(value!==undefined&&value!==null&&value!=="")));

        const columns = Object.keys(FilteredBody);
        const values = Object.values(FilteredBody);

        values.push(ID);

        const columnsString = (columns.map((column,index)=>`${column}=$${index+1}`)).join(',');
        const query = `UPDATE car SET ${columnsString} WHERE "ID"=$${columns.length+1} `;

        const {rowCount} = await pool.query(query,values);

        if(rowCount === 0){
            return res.status(404).json({success:false , message:"no cars where updated"});
        }

        return res.status(200).json({success:true , message:"car updated with success"});
    }catch(error){
        console.error("error while deleting the events",error);
        res.status(500).json({success:false,message:"error while adding the car",err:error.message});
    }
}

const deleteCar = async(req,res)=>{
    try{
        const carSchema = z.object({
            IDs: z.array(z.number().int()).min(1),          
        });

        const result = carSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {IDs} = result.data;

        const query = 'DELETE FROM car where "ID"=any($1)';
        const values = [IDs];

        const {rowCount} = await pool.query(query,values);

        if(rowCount === 0){
            return res.status(404).json({success:false , message:"no cars where deleted"});
        }

        return res.status(200).json({success:true , message:"car deleted with success"});
    }catch(error){
        console.error("error while deleting the events",error);
        res.status(500).json({success:false,message:"error while deleting the car",err:error.message});
    }
}

const getAllCars = async(req,res)=>{
    try{

        const decoded_token = req.decoded_token;

        if(!decoded_token){
            return res.status(400).json({ success:false, message:"missing data" });
        }

        const query = 'SELECT "ID",nom,nbr_place,matricule,categorie FROM car WHERE account_id IN (SELECT "ID" FROM accounts WHERE entreprise_id = (SELECT entreprise_id FROM accounts WHERE "ID"=$1))';
        const values = [decoded_token.id];

        const data = await pool.query(query,values);
        return res.status(200).json({success:true , message:"cars fetched with success",data:data.rows});
    }catch(error){
        console.error("error while deleting the events",error);
        res.status(500).json({success:false,message:"error while fetching the cars",err:error.message});
    }
}

module.exports = {addCar,updateCar,deleteCar,getAllCars};