import { Request, Response, NextFunction } from "express";
import { db } from "../configs/db";
import { SessionRequest } from "./sessionAuth";

export const verifyAuthWithUser = async (
  req: SessionRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).json({ message: "Missing Authorization header" });
    }

    const token = authHeader.split(" ")[1]; // Bearer <token>
    if (!token) {
      return res.status(401).json({ message: "Token missing" });
    }

    const [rows]: any = await db.query(
      `SELECT 
          s.token, 
          u.id AS userId,
          u.name AS createdBy, 
          u.role, 
          s.createdAt AS createdAt,
          s.expiresAt
       FROM session s
       JOIN user u ON s.userId = u.id
       WHERE s.token = ?`,
      [token]
    );

    if (rows.length === 0) {
      return res.status(403).json({ message: "Invalid token" });
    }

    const session = rows[0];
    const now = new Date();

    // ⏳ Expiry check
    if (new Date(session.expiresAt) <= now) {
      return res.status(403).json({ message: "Session expired" });
    }

    // ✅ Attach to request
    req.userId = session.userId;
    req.user = {
      name: session.createdBy,
      role: session.role,
      createdAt: session.createdAt,
    };

    next();
  } catch (err) {
    console.error("❌ Auth verification error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
