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
        const StaffSchema = z.object({
            ID: z.number().int().min(1),
        });

        const result = StaffSchema.safeParse({ID:Number(req.params.ID)});

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {ID} = result.data;

        const decoded_token = req.decoded_token;
        if(!decoded_token){
            return res.status(400).json({success:false,message:"missing data"});
        }

        const query = `SELECT st.nom AS staff_name, st.prenom AS staff_lastname , st.num_tel , st.email, st.departement, st.role, st.onleave 
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

const getAvailabeEventStaff = async(req,res)=>{
    try{
        const StaffSchema = z.object({
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

        const result = StaffSchema.safeParse({start_date:params.start_date,end_date:params.end_date});

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {start_date,end_date} = result.data;

        const decoded_token = req.decoded_token;
        if(!decoded_token){
            return res.status(400).json({success:false,message:"missing data"});
        }

        const query = `SELECT ls."ID" AS ls_id,CASE WHEN ls."ID" IS NULL THEN TRUE ELSE FALSE END AS disponible
                        FROM staff st
                        JOIN "Liste_staff" ls ON ls.staff_id = st."ID" 
                        LEFT JOIN team tm ON st.team_id = tm."ID"
                        LEFT JOIN evenement ev ON le.evenement_id = ev."ID" AND (ev.date_debut >= $2 OR ev.date_fin <= $1)
                        WHERE st.entreprise_id=(SELECT entreprise_id FROM accounts WHERE "ID" = $3)`;
        const values = [start_date,end_date,decoded_token.id]; 

        const data = await pool.query(query,values);
        if(!data){
            return res.status(400).json({"success":false , message:"failure"});
        }
        res.status(200).json({success:true , message:"success",data:data.rows});
    }catch(error){
        console.error("error while getting the staff",error);
        res.status(500).json({success:false,message:"error while getting the staff",err:error.message});
    }
}


const addStaffToEvent = async(req,res)=>{
    try{
        const StaffSchema = z.object({
            ID_event: z.number().int().min(1),
            ID_staff: z.number().int().min(1),
            
        });

        const result = StaffSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {ID_event,ID_staff} = result.data;

        const decoded_token = req.decoded_token;
        if(!decoded_token){
            return res.status(400).json({success:false,message:"missing data"});
        }

        const acceptedroles=["super_admin","admin","super_user"];
        if(!acceptedroles.includes(decoded_token.role)){
            return res.status(403).json({success : false, message: "missing privilege"});
        }

        const query = `INSERT INTO "Liste_staff" (evenement_id,staff_id) VALUES ($1,$2) WHERE ((SELECT role FROM accounts WHERE "ID"=$3 ) = ANY($4))`;
        const values = [ID_event,ID_staff,decoded_token.id,acceptedroles]; 

        const data = await pool.query(query,values);
        if(!data){
            return res.status(400).json({"success":false , message:"failure"});
        }
        res.status(200).json({success:true , message:"success",data:data.rows});
    }catch(error){
        console.error("error while getting staffs",error);
        res.status(500).json({success:false,message:"error while getting the staff",err:error.message});
    }
}


const removeStaffFromEvent = async(req,res)=>{
    try{
        const StaffSchema = z.object({
            ID_event: z.number().int().min(1),
            ID_staff: z.number().int().min(1), 
        });

        const result = StaffSchema.safeParse({ID_event:Number(req.params.ID_event),ID_staff:Number(params.ID_staff)});

        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const {ID_event,ID_staff} = result.data;

        const decoded_token = req.decoded_token;
        if(!decoded_token){
            return res.status(400).json({success:false,message:"missing data"});
        }

        const acceptedroles=["super_admin","admin","super_user"];
        if(!acceptedroles.includes(decoded_token.role)){
            return res.status(403).json({success : false, message: "missing privilege"});
        }

        const query = `DELETE FROM "Liste_staff" WHERE (evenement_id = $1 AND staff_id = $2 AND ((SELECT role FROM accounts WHERE "ID"=$3 ) = ANY($4)))`;
        const values = [ID_event,ID_staff,decoded_token.id,acceptedroles]; 

        const data = await pool.query(query,values);
        if(!data){
            return res.status(400).json({"success":false , message:"failure"});
        }
        res.status(200).json({success:true , message:"success",data:data.rows});
    }catch(error){
        console.error("error while getting the staff",error);
        res.status(500).json({success:false,message:"error while getting the staff",err:error.message});
    }
}



module.exports = {addStaff,updateStaff,deleteStaff,getAllStaff,getParticipation,getStaffEvents,getEventStaff,getAvailabeEventStaff,addStaffToEvent,removeStaffFromEvent}