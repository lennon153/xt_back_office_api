import { Request, Response, NextFunction } from "express";
import { log } from "../utils/logger";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  log.error(err.message || err);
  res.status(err.status || 500).json({ message: err.message || "Internal Server Error" });
};
