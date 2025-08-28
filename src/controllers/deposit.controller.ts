import {Request,Response, NextFunction } from "express";
import { createDepositService, getAllDepositService } from "../services/deposit.service";
import { ApiResponse } from "../types/api.type";
import { createDepositSchema } from "../validators/deposit.schema";


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
