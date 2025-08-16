import { Request, Response , NextFunction } from "express";
import { db } from "../configs/db";
import { log } from "console";

export interface SessionRequest extends Request {
    userId? : string;
}

export const verifySession = async (req: SessionRequest, res: Response, next: NextFunction) =>{
    try{
        const authHeader = req.headers["authorization"];
        
        if(!authHeader) {
            return res.status(401).json({message:"Missing Authorization header", Headers: authHeader})
        }

        const token = authHeader.split(" ")[1];// "Bearer <token>"

        if(!token){
            return res.status(401).json({message:"Token missing"});
        }

       // 🔍 Check session in DB
        const [rows]: any = await db.query("SELECT userId ,token, expiresAt FROM session WHERE token = ?",[token]);
        
        if(rows.length === 0){
            return res.status(403).json({message:"Invalid token"});
        } 
        const session = rows[0]
        const now = new Date();

        // ⏳ Check expiry
        if (new Date(session.expires_at) <= now) {
        return res.status(403).json({ message: "Session expired" });
        }

    // ✅ Attach userId to request
    req.userId = session.user_id;
    next();
    
    } catch(err){
        console.error("❌ Session verification error:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
}