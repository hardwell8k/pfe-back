const pool = require("../../../dbConnection");
const {z} = require("zod");

const addQA = async(req,res)=>{
    try{
        const carSchema = z.object({
            question: z.string().min(1, { message: "question is required" }),
            answer: z.string().min(1, { message: "answer is required" }),
            atelier_id: z.number().int(),
        });

        const result = carSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {question,answer,atelier_id} = req.body;

        const query = 'INSERT INTO "Q&A" (question,answer,atelier_id) VALUES ($1,$2,$3)';
        const values = [question,answer,atelier_id];

        await pool.query(query,values);
        return res.status(200).json({success:true , message:"Q&A added with success"});
    }catch(error){
        console.error("error while deleting the events",error);
        res.status(500).json({success:false,message:"error while adding the car",err:error.message});
    }
}

const updateQA = async(req,res)=>{
    try{
        const carSchema = z.object({
            question: z.string().min(1, { message: "question is required" }).optional(),
            answer: z.string().min(1, { message: "answer is required" }).optional(),
            ID: z.number().int(), 
        });

        const result = carSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({success:false, errors: result.error.errors });
        }

        const {question,answer,ID} = req.body;
        if(!question&&!answer){
            return res.status(400).json({ success:false, message:"missing data"});
        }

        const data = {question,answer}

        const FilteredBody = Object.fromEntries(Object.entries(data).filter(([key,value])=>(value!==undefined&&value!==null&&value!=="")));

        const columns = Object.keys(FilteredBody);
        const values = Object.values(FilteredBody);

        values.push(ID);

        const columnsString = (columns.map((column,index)=>`${column}=$${index+1}`)).join(',');
        const query = `UPDATE "Q&A" SET ${columnsString} WHERE "ID"=$${columns.length+1} `;

        await pool.query(query,values);
        return res.status(200).json({success:true , message:"car updated with success"});
    }catch(error){
        console.error("error while deleting the events",error);
        res.status(500).json({success:false,message:"error while adding the car",err:error.message});
    }
}

const deleteQA = async(req,res)=>{
    try{
        const carSchema = z.object({
            ID: z.number().int(),          
        });

        const result = carSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {ID} = req.body;

        const query = 'DELETE FROM "Q&A" where "ID"=$1';
        const values = [ID];

        await pool.query(query,values);
        return res.status(200).json({success:true , message:"car deleted with success"});
    }catch(error){
        console.error("error while deleting the events",error);
        res.status(500).json({success:false,message:"error while deleting the car",err:error.message});
    }
}

const getAllQAs = async(req,res)=>{
    try{

        const decoded_token = req.decoded_token;

        if(!decoded_token){
            return res.status(400).json({ success:false, message:"missing data" });
        }

        const query = 'SELECT * FROM "Q&A" WHERE atelier_id IN (SELECT "ID" FROM atelier WHERE evenement_id IN(SELECT "ID" FROM evenement WHERE client_id IN (SELECT "ID" FROM "Clients" WHERE account_id IN (SELECT "ID" FROM accounts WHERE entreprise_id =(SELECT entreprise_id FROM accounts WHERE "ID"=$1)))))';
        const values = [decoded_token.id];

        const data = await pool.query(query,values);
        return res.status(200).json({success:true , message:"cars fetched with success",data:data.rows});
    }catch(error){
        console.error("error while deleting the events",error);
        res.status(500).json({success:false,message:"error while fetching the cars",err:error.message});
    }
}

module.exports = {addQA,updateQA,deleteQA,getAllQAs};