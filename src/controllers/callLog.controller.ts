import {Request,Response, NextFunction } from "express";

import { SessionRequest } from "../middlewares/sessionAuth";
import { createCallLogService } from "../services/callLog.service";

export const createCallLogController = async (req: SessionRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const callLog = await createCallLogService(req.body, req.userId);

    res.status(201).json({
      message: "Call log created successfully",
      data: callLog,
      createdBy: req.user?.name,
    });
  } catch (err: any) {
    console.error("❌ Create call log error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
