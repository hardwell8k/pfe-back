const dayjs = require("dayjs");
const pool = require("../dbConnection");

const addEvent = async (req,res)=>{
    try{
        const {nom,edition,nbr_invite,type, date_debut, date_fin, address, description,client_id} = req.body;
        if(!nom||!nbr_invite||!type||!date_debut||!date_fin||!address||!client_id){
           return res.status(400).json({success: false, message : "missing data"});
        }
        console.log('date_debut',date_debut);
        const editionVal = edition||null;
        const descriptionVal = description||null;

        let formatted_date_debut = dayjs(date_debut);

        if(!formatted_date_debut.isValid()){
            return res.status(401).json({success:false,message:"wrong format for the starting date"});
        }

        let formatted_date_fin = dayjs(date_fin/*,"YYYY-MM-DD",true*/);

        if(!formatted_date_fin.isValid()){
            return res.status(401).json({success:false,message:"wrong format for the end date"});
        }

        if (!formatted_date_debut.isBefore(formatted_date_fin)) {
            return res.status(401).json({ success: false, message: "the start date must be before the end date" });
        }

        if(!Number.isInteger(Number(nbr_invite))){
            return res.status(401).json({success:false,message:"number of guests is not an integer"});
        }

        if(!Number.isInteger(Number(client_id))){
            return res.status(401).json({success:false,message:"client id must be an integer"});
        }
        

        const querry = "INSERT INTO evenement (nom,type,edition,nbr_invite,description,date_debut,date_fin,address) values($1, $2, $3, $4, $5, $6, $7, $8)";
        const values = [nom,type,editionVal,nbr_invite, descriptionVal, formatted_date_debut, formatted_date_fin, address];

        await pool.query(querry,values);
        return res.status(201).json({success: true, message : "event saved with success"});
    }catch(error){
        console.error("error while getting the events",error);
        res.status(500).json({success: false , message:"failed to save",err:error.message});
    }
}
//problem with the time zone resulting in day-1
const getUPcomingEvents = async (req,res)=>{
    try{
        const today = dayjs().format('YYYY-MM-DD');
        //return res.status(300).json({success:false,message:"fuck dates ",today:today})

        const query = 'SELECT * FROM evenement WHERE date_debut > ($1) ORDER BY date_debut';
        const values = [today];

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

//some values can be "" some cant 
//problem with the date being timestamp
const updateEvent = async(req,res)=>{
    try {
        const {nom,edition,nbr_invite,type, date_debut, date_fin, address, description,client_id,ID} = req.body;
        //checking if the necessary data for the update are available
        if(!ID||([nom,nbr_invite,type,date_debut,date_fin,address,edition,description,client_id].every((value)=>(value===undefined)))){
           return res.status(400).json({success: false, message : "missing data"});
        }

        if(!Number.isInteger(Number(ID))){
            return res.status(401).json({success:false,message:"id must be an integer"});
        }

        if(client_id && !Number.isInteger(Number(client_id))){
            return res.status(401).json({success:false,message:"client id must be an integer"});
        }

        if(nbr_invite&&!Number.isInteger(Number(nbr_invite))){
            return res.status(401).json({success:false,message:"number of guests is not an integer"});
        }

        if(date_debut && (dayjs(date_debut.slice(10),"YYYY-MM-DD",true)).isValid()){
            return res.status(401).json({success:false,message:"wrong format for the start date"});
        }

        if(date_fin && (dayjs(date_fin.slice(10))).isValid()){
            return res.status(401).json({success:false,message:"wrong format for the end date"});
        }

        //!!!!!!!!!!!need to fix this and put it back
        
        /*if (date_debut && date_fin && !((dayjs(date_debut.slice(10))).isBefore((dayjs(date_fin.slice(10)))))) {
            return res.status(401).json({ success: false, message: "the start date must be before the end date" });
        }*/

        const data = {nom,edition,nbr_invite,type, date_debut, date_fin, address, description}
        //filtering the undefined values
        const FilteredBody = Object.fromEntries(Object.entries(data).filter(([key,value])=>{  if((["date_debut","date_fin"].includes(key))&&value===""){return false};return (value!==undefined)}));//the "" pass through

        //extracting the columns from the filterd data
        const columns = Object.keys(FilteredBody);
        //extracting the values from the filterd data
        const values = Object.values(FilteredBody);
        
        //adding the ID to the values
        values.push(ID);

        //creating the sql query
        const columnsString = (columns.map((column,index)=>`${column}=$${index+1}`)).join(',');
        const query = `UPDATE evenement SET ${columnsString} WHERE "ID"=$${columns.length+1} `;

        await pool.query(query,values);
        return res.status(200).json({success:true , message:"success"});

    } catch (error) {
        console.error("error while updating the events",error);
        res.status(500).json({success:false,message:error.message,err:error.err})   
    }
}

const deleteEvent = async(req,res)=>{
    try{
        const {ID} = req.body;
        if(!ID){
            return res.status(400).json({success: false, message : "missing data"});
        }

        const query = 'DELETE FROM evenement WHERE "ID"=$1';
        const values = [ID];

        await pool.query(query,values);
        return res.status(200).json({success:true , message:"success"});
    }catch(error){
        console.error("error while deleting the events",error);
        res.status(500).json({success:false,message:"error while deleting the events",err:error.message});
    }
}

module.exports = {addEvent,updateEvent,deleteEvent,getUPcomingEvents};