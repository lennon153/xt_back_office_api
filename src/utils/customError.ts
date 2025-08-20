import { HttpStatusCode } from "../constants/httpStatus";

// src/utils/CustomError.ts
export class AppError extends Error {
  public readonly statusCode: HttpStatusCode;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: HttpStatusCode,
    isOperational = true
  ) {
    super(message);

    Object.setPrototypeOf(this, new.target.prototype);

    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this);
  }
}