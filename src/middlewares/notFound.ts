// src/middleware/notFound.ts
import { Request, Response, NextFunction } from "express";
import { CustomError } from "../utils/customError";


export const notFound = (req: Request, _res: Response, next: NextFunction) => {
  next(new CustomError(`Route ${req.originalUrl} not found`, 404));
};
