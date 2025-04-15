const pool = require('../dbConnection');


const addClient = async(req,res)=>{
    try {
        const {nom,domain,num_tel,email} = req.body;
        if(!nom||!domain||!num_tel||!email){
            return res.status(400).json({success:false,message:"missing data"});
        }

        const query = 'INSERT INTO "Clients" (nom,domain,num_tel,email) VALUES ($1,$2,$3,$4)';
        const values = [nom,domain,num_tel,email];

        await pool.query(query,values);

        return res.status(200).json({success : true, message: "client added with success"});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

const getAllClients = async(req,res)=>{
    try {
        const query = 'SELECT * FROM "Clients"'
        const data = await pool.query(query);
        return res.status(200).json({success : true, message: "clients selected with success",data:data.rows});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

//const getSpecificClients = async(req,res)=>{}


module.exports = {addClient,getAllClients}