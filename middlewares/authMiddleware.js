const jwt = require("jsonwebtoken");
const secret = require('../secret');

function auth(req,res,next){

    const token = req.cookies?.token;

    if(!token){
        return res.status(401).json({success:false,message:"Missing token"});
    }

    jwt.verify(token,secret.MY_SECRET,(err,decoded)=>{
        if(err){
            return res.status(403).json({success:false,message:"Invalide Token"});
        }
        req.decoded_token = decoded;
        
        next();
    });
        
    
    
}

module.exports = auth;