import {Request,Response, NextFunction } from "express";

import { SessionRequest } from "../middlewares/sessionAuth";
import { createCallLogService, deleteCallLogService, getAllCallLogService, getCallLogByIdService, updateCallLogService } from "../services/callLog.service";
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

// -----------------------
// Get All with Pagination + Search
// -----------------------
export const getAllCallLogController = async (
  req: Request,
  res: Response<ApiResponse<any>>,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string) || "";

    const result = await getAllCallLogService(page, limit, search);

    return res.status(200).json({
      success: true,
      message: "Call logs fetched successfully",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (err: any) {
    console.error("❌ Get all call logs error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      errors: err.message,
    });
  }
};


// -----------------------
// Get By ID
// -----------------------
export const getCallLogByIdController = async (
  req: Request<{ id: string }>,
  res: Response<ApiResponse<any>>,
  next: NextFunction
) => {
  try {
    const callId = Number(req.params.id);
    if (isNaN(callId) || callId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid call_id",
      });
    }

    const callLog = await getCallLogByIdService(callId);

    return res.status(200).json({
      success: true,
      message: "Call log fetched successfully",
      data: callLog,
    });
  } catch (err: any) {
    next(err)
  }
};

// -----------------------
// Update
// -----------------------
export const updateCallLogController = async (
  req: Request<{ id: string }>,
  res: Response<ApiResponse<any>>,
  next: NextFunction
) => {
  try {
    const callId = Number(req.params.id);
    if (isNaN(callId) || callId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid call_id",
      });
    }

    const updateData = req.body;

    // ✅ Validate datetime fields
    const dateFields = ["call_start_at", "call_end_at", "next_action_at"];
    for (const field of dateFields) {
      if (updateData[field] && isNaN(new Date(updateData[field]).getTime())) {
        return res.status(400).json({
          success: false,
          message: `Invalid datetime format for '${field}'. Please use YYYY-MM-DD HH:MM:SS or ISO string.`,
        });
      }
    }

    // ✅ Optional: validate call_status if you have an ENUM
    const allowedStatuses = ["pending","in-progress","completed","no_answer"];
    if (updateData.call_status && !allowedStatuses.includes(updateData.call_status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid call_status. Allowed values: ${allowedStatuses.join(", ")}`,
      });
    }

    const result = await updateCallLogService(callId, updateData);

    return res.status(200).json({
      success: true,
      message: "Call log updated successfully",
      data: result,
    });
  } catch (err: any) {
    next(err)
  }
};


// -----------------------
// Delete
// -----------------------
export const deleteCallLogController = async (
  req: Request<{ id: string }>,
  res: Response<ApiResponse<any>>,
  next: NextFunction
) => {
  try {
    const callId = Number(req.params.id);
    if (isNaN(callId) || callId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid call_id",
      });
    }

    const result = await deleteCallLogService(callId);

    return res.status(200).json({
      success: true,
      message: "Call log deleted successfully",
      data: result,
    });
  } catch (err: any) {
      next(err)
  }
};