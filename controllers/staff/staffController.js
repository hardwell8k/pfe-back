const pool = require("../../dbConnection");
const {z} = require("zod");

const addStaff = async (req,res)=>{
    try {
        const staffSchema = z.object({
            nom: z.string().trim().min(1, { message: "Nom is required" }),
            prenom: z.string().min(1, { message: "last name is required" }).optional(),
            role: z.string().min(1, { message: "Role is required" }),
            departement: z.string().min(1, { message: "department is required" }).optional(),
            num_tel: z.number().int().optional(),
            email: z.string().email({ message: "Invalid email format" }).optional(),
            team_id: z.number().int().optional(),
        });

        const result = staffSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const decoded_token = req.decoded_token
        const {nom,prenom,num_tel,email,departement,role,team_id} = req.body;

        if(!decoded_token){
            return res.status(400).json({success:false,message:"missing data"});
        }

        const query = 'INSERT INTO staff (nom,prenom,num_tel,email,departement,role,team_id,entreprise_id) VALUES ($1,$2,$3,$4,$5,$6,$7,(SELECT entreprise_id FROM accounts WHERE "ID" = $8)) RETURNING "ID"';
        const values = [nom,prenom,num_tel,email,departement,role,team_id,decoded_token.id];

        const data = await pool.query(query,values);
        if(data.rowCount === 0){
            return res.status(200).json({success : true, message: "no staff was added"});
        }

        return res.status(200).json({success : true, message: "staff added with success",ID:data.rows[0].ID});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

const updateStaff = async (req,res)=>{
    try {
        const staffSchema = z.object({
            nom: z.string().trim().min(1, { message: "Nom is required" }).optional(),
            prenom: z.string().min(1, { message: "Address is required" }).optional(),
            role: z.string().min(1, { message: "Address is required" }).optional(),
            departement: z.string().min(1, { message: "Address is required" }).optional(),
            num_tel: z.number().int().optional(),
            email: z.string().email({ message: "Invalid email format" }).optional(),
            team_id: z.number().int().optional(),
            team: z.string().min(1).optional(),
            ID: z.number().int(),
        });

        const result = staffSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {nom,prenom,num_tel,email,departement,role,team,ID} = result.data;

        if(!ID||[nom,prenom,num_tel,email,departement,role,team].every((value)=>(value===undefined))){
            return res.status(400).json({success:false,message:"missing data"});
        }

        //need to check for predetermened team names

        
        const data = {nom,prenom,num_tel,email,departement,role}

        const FilteredBody = Object.fromEntries(Object.entries(data).filter(([key,value])=>(value!==undefined&&value!==null&&value!=="")));

        const columns = Object.keys(FilteredBody);
        const values = Object.values(FilteredBody);


        let columnsString = (columns.map((column,index)=>`${column}=$${index+1}`)).join(',');
        if(team){
            const teamParamIndex = values.length + 1;
            values.push(team)
            columnsString = `${columnsString},team_id = (SELECT "ID" FROM team WHERE team.nom = $${teamParamIndex})`;
        }

        const idParamIndex = values.length + 1
        values.push(ID);

        const query = `UPDATE staff SET ${columnsString} WHERE "ID"=$${idParamIndex} `;

        

        await pool.query(query,values);

        return res.status(200).json({success : true, message: "staff updated with success"});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

const deleteStaff = async(req,res)=>{
    try {
        const staffSchema = z.object({
            ID: z.number().int().min(1),
        });

        const result = staffSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {ID} = req.body;

        const query = 'DELETE FROM staff WHERE "ID"=$1';
        const values = [ID];

        await pool.query(query,values);
        return res.status(200).json({success: true, message : "staff deleted with success"});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

const getAllStaff = async (req,res)=>{
    try {
        const decoded_token = req.decoded_token;

        if(!decoded_token){
            return res.status(400).json({success:false,message:"missing data"});
        }

        const query = 'SELECT staff."ID",staff.nom,staff.prenom,staff.email,staff.departement,staff.num_tel,staff.role,team.nom AS team_nom FROM staff LEFT JOIN team ON staff.team_id = team."ID" WHERE staff.entreprise_id=(SELECT entreprise_id FROM accounts WHERE "ID" = $1)';
        const values = [decoded_token.id];

        const data = await pool.query(query,values);
        if(!data){
            return res.status(400).json({"success":false , message:"failure"});
        }
        return res.status(200).json({success: true, message : "staffs fetched with success",data:data.rows});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

const getParticipation = async (req,res)=>{
    try {
        const decoded_token = req.decoded_token;

        if(!decoded_token){
            return res.status(400).json({success:false,message:"missing data"});
        }

        const query = `SELECT ls.staff_id , e.date_debut ,e.nom
                        FROM evenement e
                        LEFT JOIN "Liste_staff" ls ON ls.evenement_id = e."ID"
                        WHERE e.client_id = ANY(SELECT "ID" FROM "Clients" WHERE entreprise_id=(SELECT entreprise_id FROM accounts WHERE "ID" = $1))
                        AND e.date_debut BETWEEN date_trunc('month', CURRENT_DATE) - INTERVAL '5 months' AND CURRENT_DATE`;
        const values = [decoded_token.id];

        const data = await pool.query(query,values);
        if(!data){
            return res.status(400).json({"success":false , message:"failure"});
        }
        return res.status(200).json({success: true, message : "participation fetched with success",data:data.rows});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

const addStaffToEvent = async (req,res)=>{
    try {
        const staffSchema = z.object({
            staff_id: z.number().int().min(1),
            event_id: z.number().int().min(1),
            date_debut: z.string().refine(val => !isNaN(new Date(val).getTime()), {
                message: "Invalid start date format"
            }),
            date_fin: z.string().refine(val => !isNaN(new Date(val).getTime()), {
                message: "Invalid end date format"
            }),
        });

        const result = staffSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {staff_id,event_id,date_debut,date_fin} = result.data;
        

        const query = 'INSERT INTO "Liste_staff" (staff_id,evenement_id,date_debut,date_fin) VALUES ($1,$2,$3,$4)';
        const values = [staff_id,event_id,date_debut,date_fin];

        const {rowCount} = await pool.query(query,values);

        if(rowCount === 0){
            return res.status(400).json({"success":false , message:"failure"});
        }
        return res.status(200).json({success: true, message : "staffs added to the event with success"});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}


const getStaffEvents = async (req,res)=>{
    try {
        const staffSchema = z.object({
            staff_id: z.number().int().min(1),
        });

        const result = staffSchema.safeParse({staff_id:Number(req.params.id)});

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {staff_id} = result.data;

        const decoded_token = req.decoded_token;

        if(!decoded_token){
            return res.status(400).json({success:false,message:"missing data"});
        }
        

        const query = `SELECT e."ID" AS event_id,e.nom AS event_name,e.date_debut AS date_debut,e.date_fin AS date_fin,e.type AS type,e.edition AS edition,e.nbr_invite AS nbr_invite ,e.description AS description,e.address AS address,e.client_id AS client_id,c.nom AS client_name
                        FROM evenement e
                        JOIN "Liste_staff" ls ON ls.evenement_id = e."ID"
                        JOIN staff s ON ls.staff_id = s."ID" 
                        LEFT JOIN "Clients" c ON c."ID"=e.client_id
                        WHERE s."ID" = $1 AND s.entreprise_id = (SELECT entreprise_id FROM accounts WHERE "ID" = $2)`;
        const values = [staff_id,decoded_token.id];

        const data = await pool.query(query,values);

        if(data.rowCount === 0){
            return res.status(400).json({"success":false , message:"failure"});
        }
        return res.status(200).json({success: true, message : "staffs events fetched with success",data:data.rows});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

const getEventStaff = async(req,res)=>{
    try{
        const equipmentSchema = z.object({
            ID: z.z.number().int().min(1),
        });

        const result = equipmentSchema.safeParse({ID:req.params.ID});

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {ID} = result.data;

        const decoded_token = req.decoded_token;
        if(!decoded_token){
            return res.status(400).json({success:false,message:"missing data"});
        }

        const query = `SELECT st.nom AS staff_name, st.prenom AS staff_lastname , st.num_tel , st.email, st.departement, st.role, st.onleave, 
                        FROM staff st
                        JOIN "Liste_staff" ls ON ls.staff_id = st."ID" 
                        LEFT JOIN team te ON st.team_id = te."ID"
                        WHERE ls.evenement_id = $1
                        AND st.entreprise_id=(SELECT entreprise_id FROM accounts WHERE "ID" = $2)`;
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




module.exports = {addStaff,updateStaff,deleteStaff,getAllStaff,getParticipation,addStaffToEvent,getStaffEvents,getEventStaff}