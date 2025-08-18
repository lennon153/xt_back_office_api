// src/middleware/requestLogger.ts
import { Request, Response, NextFunction } from "express";

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.connection.remoteAddress;

  res.on("finish", () => {
    const status = res.statusCode;
    const statusText = status >= 400 ? "FAIL" : "SUCCESS";
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - IP: ${ip} - ${status} ${statusText}`
    );
  });

  next();
};
