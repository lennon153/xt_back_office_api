import {Request,Response, NextFunction } from "express";

import { SessionRequest } from "../middlewares/sessionAuth";
import { createCallLogService } from "../services/callLog.service";
import { ApiResponse } from "../types/api.type";

// -----------------------
// Create
// -----------------------
export const createCallLogController = async (
  req: SessionRequest, 
  res: Response<ApiResponse<any>>, 
  next: NextFunction
) => {
  try {
    // Check if the user is authenticated
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Call service to create the call log
    const callLog = await createCallLogService(req.body, req.userId);

    // Successful creation response
    return res.status(201).json({
      success: true,
      message: "Call log created successfully",
      data: callLog,
      //TODO: Implement on monday
      // createdBy: req.user?.name,
    });
  } catch (err: any) {
    // Log error and send server error response
    console.error("❌ Create call log error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      errors: err.message || "Something went wrong",
    });
  }
};