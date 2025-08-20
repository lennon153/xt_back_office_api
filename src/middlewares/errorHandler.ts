// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/customError";
import { HttpStatus } from "../constants/httpStatus";


export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  console.error("Unexpected error:", err);

  res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: "Internal server error",
  });

  
};

// Custom error class example
export class CustomError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 400
  ) {
    super(message);
  }
}

export { AppError };
