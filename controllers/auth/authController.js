const pool = require('../../dbConnection');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const secret = require('../../secret');

const signUp = async (req,res)=>{
    try {
        const {nom,email,password,role,type,activation_date,deactivation_date} = req.body;
        if(!email||!password||!type||!role){
            return res.status(400).json({success:false,message:"missing data"});
        }

        if((type === 'temporaire')&&(!activation_date||!deactivation_date)){
            return res.status(400).json({success:false,message:"missing data"});
        }

        crypted_password = await bcrypt.hash(password,10);  
        let query = '';
        let values = [];

        if(type === 'temporaire'){
            query = 'INSERT INTO accounts (nom,email,password,role,type,activation_date,deactivation_date) VALUES ($1,$2,$3,$4,$5,$6,$7)';
            values = [nom,email,crypted_password,role,type,activation_date,deactivation_date];
        }else{
            query = 'INSERT INTO accounts (nom,email,password,role,type) VALUES ($1,$2,$3,$4,$5)';
            values = [nom,email,crypted_password,role,type];
        }
        
        await pool.query(query,values);

        return res.status(200).json({success : true, message: "account added with success"});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

const logIn = async (req,res)=>{
    try {
        const {email,password} = req.body;
        if(!email||!password){
            return res.status(400).json({success:false,message:"missing data"});
        }

        const query = 'SELECT * FROM accounts WHERE email = $1';
        const values = [email];

        const result = await pool.query(query,values);
        const account = result.rows[0]; 

        if(!account){
            return res.status(401).json({success:false,message:"account email does not exist"});
        }

        if(!(await bcrypt.compare(password,account.password))){
            return res.status(402).json({success:false,message:"wrong password"});
        }
        
        const token = jwt.sign({id:account.ID,role:account.role},secret.MY_SECRET,{expiresIn:'2h'});

        const Tokenquery = 'UPDATE accounts SET token = $1 WHERE "ID" = $2';
        const Tokenvalues = [token,account.ID];
        await pool.query(Tokenquery,Tokenvalues);
        return res.status(200).cookie('token',token,{httpOnly:true,secure:false,sameSite:'lax',domain: 'localhost',maxAge:10800000}).json({success : true, message: "loged in with success"});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

const getAcounts = async(req,res)=>{
    try {
        const token = req.cookies ? req.cookies.token : null;
        if(!token){
            return res.status(400).json({success:false,message:"missing data"});
        }

        const decoded_token = jwt.decode(token);

        let query = '';
        let values = [];
        
        if(decoded_token.role === 'super_admin'){

            query = 'SELECT * FROM accounts';

            const result = await pool.query(query);

            return res.status(200).json({success : true, message: "fetched accounts with success",data:result.rows});
        }

        if(decoded_token.role === 'admin'){

            query = 'SELECT * FROM accounts WHERE "ID"= $1';
            values = [decoded_token.id]

            const result = await pool.query(query,values);
            
            return res.status(200).json({success : true, message: "fetched accounts with success",data:result.rows});
        }

        return res.status(401).json({success : true, message: "not enough privilege",data:result.rows});
 
    } catch (error) {
        return res.status(500).json({success:false,message:error.message});
    }
}

module.exports = {signUp,logIn,getAcounts}