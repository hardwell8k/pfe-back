const pool = require('../dbConnection')

const getEventTypes = async (req,res)=>{
    try {

        const querry = "SELECT nom FROM evenement_type";
        const data = await pool.query(querry);
        if(data){
            return res.status(200).json({success:true,data:data.rows});
        }
        return res.status(400).json({success:false,message:"failed in fetching data"});
    } catch (error) {
        console.error("error in get types",error);
    }
}

const addEventType = async(req,res)=>{
    try {
        const {name} = req.body;
        if(!name){
            return res.status(400).json({success:false,message:"missing name"});
        }
        const query = 'INSERT INTO evenement_type (nom) VALUES ($1)';
        await pool.query(query,[name]);

        return res.status(200).json({success:true,message:"success"})
    } catch (error) {
        console.error("error while adding type ", error.err)
        res.status(505).json({success:false,message:"failed to add a new type",err:error.message})
    }
}

module.exports = {getEventTypes,addEventType};