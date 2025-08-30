import { Request, Response, NextFunction } from "express";
import { createPlatformService, deletePlatformService, getAllPlatformsService, getPlatformByIdService, updatePlatformService } from "../services/platform.service";
import { ApiResponse } from "../types/api.type";
import { createPlatformSchema, updatePlatformSchema } from "../validators/platform.schema";

// -----------------------
// Get All
// -----------------------
export const getAllPlatformsController = async (
  req: Request,
   res: Response<ApiResponse<any>>, 
   next: NextFunction
  ) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const search = (req.query.search as string) || undefined;

      const result = await getAllPlatformsService(page, limit, search);

      return res.json({
        success: true,
        message: "Platforms retrieved successfully",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
};

// -----------------------
// Get By ID
// -----------------------
export const getPlatformByIdController = async (
  req: Request, 
  res: Response<ApiResponse<any>>,
   next: NextFunction
  ) => {
    try {
      const platform_id = Number(req.params.id);
      const platform = await getPlatformByIdService(platform_id);

      return res.json({ success: true, message: "Platform retrieved", data: platform });
    } catch (err: any) {
      res.status(404).json({ success: false, message: err.message });
    }
};

// -----------------------
// Create
// -----------------------
export const createPlatformController = async (
  req: Request, 
  res: Response<ApiResponse<any>>, 
  next: NextFunction
) => {
    try {
      const parsed = createPlatformSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: parsed.error.issues.map(i => i.message).join(", "),
          errors: parsed.error.issues.map(i => ({ path: i.path.join("."), message: i.message })),
        });
      }

      const platform = await createPlatformService(parsed.data);
      return res.status(201).json({ success: true, message: "Platform created successfully", data: platform });
    } catch (err: any) {
      if (err.message.includes("type_id")) {
        return res.status(400).json({ success: false, message: err.message });
      }
      next(err);
    }
};

// -----------------------
// Update
// -----------------------
export const updatePlatformController = async (
  req: Request, 
  res: Response<ApiResponse<any>>, 
  next: NextFunction) => {
    try {
      const parsed = updatePlatformSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: parsed.error.issues.map(i => i.message).join(", "),
          errors: parsed.error.issues.map(i => ({ path: i.path.join("."), message: i.message })),
        });
      }

      const platform_id = Number(req.params.id);
      const platform = await updatePlatformService(platform_id, parsed.data);
      return res.json({ success: true, message: "Platform updated successfully", data: platform });
    } catch (err: any) {
      if (err.message.includes("type_id")) {
        return res.status(400).json({ success: false, message: err.message });
      }
      res.status(404).json({ success: false, message: err.message });
    }
};

// -----------------------
// Delete
// -----------------------
export const deletePlatformController = async (
  req: Request, 
  res: Response<ApiResponse<any>>, 
  next: NextFunction) => {
    try {
      const platform_id = Number(req.params.id);
      const result = await deletePlatformService(platform_id);

      return res.json({ success: true, message: "Platform deleted successfully", data: result });
    } catch (err: any) {
      res.status(404).json({ success: false, message: err.message });
    }
};