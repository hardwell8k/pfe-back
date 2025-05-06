const pool = require('../../../dbConnection');

const getEventTypes = async (req,res)=>{
    try {
        const decoded_token = req.decoded_token;
        console.log("decoded_token id: ",JSON.stringify(decoded_token));
        const querry = 'SELECT nom FROM evenement_type WHERE account_id IN (SELECT "ID" FROM accounts WHERE entreprise_id=(SELECT entreprise_id FROM accounts WHERE "ID" = $1))';
        const values = [decoded_token.id];
        const data = await pool.query(querry,values);
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
        const decoded_token = req.decoded_token;
        if(!name||!decoded_token.id){
            return res.status(400).json({success:false,message:"missing name"});
        }
        const query = 'INSERT INTO evenement_type (nom,account_id) VALUES ($1,$2)';
        const values = [name,decoded_token.id];
        await pool.query(query,values);

        return res.status(200).json({success:true,message:"success"})
    } catch (error) {
        console.error("error while adding type ", error.err)
        res.status(505).json({success:false,message:"failed to add a new type",err:error.message})
    }
}

module.exports = {getEventTypes,addEventType};