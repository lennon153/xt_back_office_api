import {Request,Response, NextFunction } from "express";
import { createDepositService, deleteDepositAndCaseService, getAllDepositService, getDepositByCaseIdService, getDepositsByUserIdService, updateDepositAndCaseService } from "../services/deposit.service";
import { ApiResponse } from "../types/api.type";
import { createDepositSchema } from "../validators/deposit.schema";
import { isValidUserId } from "../utils/validators";

// -----------------------
// Create
// -----------------------
export const createDepositController = async (
  req: Request,
  res: Response<ApiResponse<any>>,
  next: NextFunction
) => {
  try {
    // Validate request body
    const parsed = createDepositSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten(),
      });
    }

    // Call service to create deposit
    const createdDeposit = await createDepositService(parsed.data);

    return res.status(201).json({
      success: true,
      message: "Deposit created successfully",
      data: createdDeposit,
    });
  } catch (err) {
    next(err);
  }
};

// -----------------------
// Get All
// -----------------------
export const getAllDepositController = async (
  req: Request,
  res: Response<ApiResponse<any>>,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string) || '';

    const result = await getAllDepositService(page, limit, search);

    return res.status(200).json({
      success: true,
      message: "Deposits fetched successfully",
      data: {
        deposits: result.data
      },
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
};

// -----------------------
// Update
// -----------------------
export const updateDepositAndCaseController = async (
  req: Request,
  res: Response<ApiResponse<any>>,
  next: NextFunction
) => {
  try {
    const depositId = Number(req.params.id);
    const data = req.body;

    const updatedDeposit = await updateDepositAndCaseService(depositId, data);

    return res.json({
      success: true,
      message: "Deposit updated successfully",
      data: updatedDeposit,
    });
  } catch (err: any) {
    next(err);
  }
};

// -----------------------
// Delete
// -----------------------
export const deleteDepositAndCaseController = async (
  req: Request,
  res: Response<ApiResponse<any>>,
  next: NextFunction
) => {
  try {
    const depositId = Number(req.params.id);

    const deletedDeposit = await deleteDepositAndCaseService(depositId);

    return res.json({
      success: true,
      message: "Deposit deleted successfully",
      data: deletedDeposit,
    });
  } catch (err: any) {
    next(err);
  }
};

// -----------------------
// Get By Case ID
// -----------------------
export const getDepositsByCaseIdController = async (
  req: Request,
  res: Response<ApiResponse<any>>,
  next: NextFunction
) => {
  try {
    const caseId = Number(req.params.caseId);

    // If caseId is invalid, send an error response
    if (isNaN(caseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid caseId",
      });
    }

    // Fetch deposits by caseId
    const deposits = await getDepositByCaseIdService(caseId);

    // If no deposits are found, return an empty data response
    if (deposits.length === 0) {
      return res.json({
        success: true,
        message: "No deposits found for the given case",
      });
    }

    // Return the deposits in the response
    return res.json({
      success: true,
      message: "Deposits retrieved for the case",
      data: deposits,
    });
  } catch (err: any) {
    // If any error occurs, pass it to the next middleware or send a response with the error
    next(err);
  }
};

// -----------------------
// Get By Use ID
// -----------------------
export const getDepositsByUserIdController = async (
  req: Request,
  res: Response<ApiResponse<any>>,
  next: NextFunction
) => {
  try {
    const userId = req.params.userId;

    // Check if userId is provided
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId parameter is required",
      });
    }

    // Validate userId format
    if (!isValidUserId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid userId format. Must be an alphanumeric string.",
      });
    }

    // Fetch deposits for the user from the service
    const deposits = await getDepositsByUserIdService(userId);

    // If no deposits found, return a "not found" message
    if (deposits.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No deposits found for user with ID ${userId}`,
      });
    }

    // Return the deposits as response
    return res.json({
      success: true,
      message: "Deposits retrieved for the user",
      data: deposits,
    });
  } catch (err: any) {
    next(err); // Forward errors to the global error handler
  }
};