const pool = require('../../dbConnection');
const jwt = require('jsonwebtoken')

const addEquipment = async(req,res)=>{
    try {
        const token = req.cookies ? req.cookies.token : null;

        const {nom,code_bar,RFID,details,category,type} = req.body;
        if(!nom||!category||!type||!token){
            return res.status(400).json({success:false,message:"missing data"});
        }

        const decoded_token = jwt.decode(token);
        
        const query = 'INSERT INTO equipement (nom,code_bar,"RFID",details,category,type,account_id) VALUES ($1,$2,$3,$4,$5,$6,$7)';
        const values = [nom,code_bar,RFID,details,category,type,decoded_token.id];

        await pool.query(query,values);

        return res.status(200).json({success : true, message: "equipment added with success"});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

const getAllEquipment = async(req,res)=>{
    try {
        const token = req.cookies ? req.cookies.token : null;
        if(!token){
            return res.status(400).json({success:false,message:"missing data"});
        }

        const decoded_token = jwt.decode(token);

        const query = 'SELECT equipement.nom,equipement.details,category.nom AS category_nom,type_nom,count(*) AS quantity FROM equipement,category,type WHERE equipement.category=category."ID" AND equipement.type=type."ID" AND equipement.account_id=$1 GROUP BY equipement.nom,equipement.details,category_nom,type_nom';
        const values = [decoded_token.id];

        const data = await pool.query(query,values);

        return res.status(200).json({success : true, message: "equipment selected with success",data:data.rows});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

const getDisponibility = async(req,res)=>{
    try {
        const token = req.cookies ? req.cookies.token : null;
        if(!token){
            return res.status(400).json({success:false,message:"missing data"});
        }

        const decoded_token = jwt.decode(token);

        const {year} = req.body;
        const currentYear = year;
        if(!year){
            currentYear = new Date().getFullYear();
        }

        const janFirst = `${currentYear}-01-01`;
        const dec31 = `${currentYear}-12-31`;

        const query = 'SELECT date_debut,date_fin,id_equipement FROM liste_equipement WHERE date_debut>= $1 AND date_debut <=$2 AND (SELECT "ID" FROM equipement WHERE  account_id = $3 ) = "ID_equipement"';
        const values = [janFirst,dec31,decoded_token.id];
        
        const data = await pool.query(query,values);
        return res.status(200).json({success : true, message: "fetched data with success",data:data.rows});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}


const addequipmentType = async()=>{
    try {
        const {type_nom,id_achete,id_loue} = req.body;
        if(!id_achete&&!id_loue){
            return res.status(400).json({success:false,message:"missing data"});
        }

        const query = 'INSERT INTO type (type_nom,id_achete,id_loue) VALUES ($1,$2,$3)';
        const values = [type_nom,id_achete,id_loue];

        await pool.query(query,values);

        return res.status(200).json({success : true, message: "equipment added with success"});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

module.exports={addEquipment,getAllEquipment}