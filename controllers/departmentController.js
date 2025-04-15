const pool = require('../dbConnection');

const addDepartment = async(req,res)=>{
    try {
        const {nom,department,num_tel,email,client_id} = req.body;
        if(!nom||!department||!num_tel||!email||!client_id){
            return res.status(400).json({success:false,message:"missing data"});
        }

        if(!Number.isInteger(Number(num_tel))){
            return res.status(401).json({success:false,message:"num_tel must be an integer"});
        }

        if(!Number.isInteger(Number(client_id))){
            return res.status(401).json({success:false,message:"client id must be an integer"});
        }

        const query = 'INSERT INTO department (nom,department,num_tel,email,client_id) VALUES ($1,$2,$3,$4,$5)';
        const values = [nom,department,num_tel,email,client_id];

        await pool.query(query,values);
        return res.status(200).json({success:true,message:"department added"});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

const getClientDepartments = async (req,res)=>{
    try {
        const {client_id} = req.body;
        if(!client_id){
            return res.status(400).json({success:false,message:"missing data"});
        }

        if(!Number.isInteger(Number(client_id))){
            return res.status(401).json({success:false,message:"client id must be an integer"});
        }

        const query = "SELECT nom,department,num_tel,email,client_id FROM department WHERE client_id = $1 ";
        const values = [client_id];

        const data = await pool.query(query,values);
        return res.status(200).json({success:true,message:"success",data:data.rows});

    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

module.exports = {addDepartment,getClientDepartments};