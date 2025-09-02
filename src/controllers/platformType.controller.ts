import { Request, Response, NextFunction } from "express";
import { createPlatformTypeService, deletePlatformTypeService, getAllPlatformsTypeService, getPlatformTypeByIdService, updatePlatformTypeService } from "../services/platformType.service";
import { ApiResponse } from "../types/api.type";
import { createPlatformSchema } from "../validators/platformType.schema";

// -----------------------
// Get All
// -----------------------
export const getAllPlatformsTypeController = async (
  req: Request,
  res: Response<ApiResponse<any>>,
  next: NextFunction
) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const search = (req.query.search as string) || undefined;

    const result = await getAllPlatformsTypeService(page, limit, search);

    return res.json({
      success: true,
      message: "Platforms retrieved successfully",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (err: any) {
    next(err);
  }
};


// -----------------------
// Get By Id
// -----------------------
export const getPlatformTypeByIdController = async (
    req: Request, 
    res: Response<ApiResponse<any>>, 
    next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    const platform = await getPlatformTypeByIdService(id);
    return res.json({ success: true, message: "Platform type retrieved", data: platform });
  } catch (err: any) {
    res.status(404).json({ success: false, message: err.message });
  }
};

// -----------------------
// Create
// -----------------------
export const createPlatformTypeController = async (
  req: Request, 
  res: Response<ApiResponse<any>>, 
  next: NextFunction) => {
    try {
      const parsed = createPlatformSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: parsed.error.issues.map(i => i.message).join(", "),
          errors: parsed.error.issues.map(i => ({ path: i.path.join("."), message: i.message })),
        });
      }

      const platform = await createPlatformTypeService(parsed.data);
      return res.status(201).json({ success: true, message: "Platform created successfully", data: platform });
    } catch (err) {
      next(err);
    }
};

// -----------------------
// Update
// -----------------------
export const updatePlatformTypeController = async (
    req: Request, 
    res: Response<ApiResponse<any>>, 
    next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    const platform = await updatePlatformTypeService(id, req.body);
    return res.json({ success: true, message: "Platform type updated", data: platform });
  } catch (err: any) {
    res.status(404).json({ success: false, message: err.message });
  }
};

// -----------------------
// Delete
// -----------------------
export const deletePlatformTypeController = async (
    req: Request, 
    res: Response<ApiResponse<any>>, 
    next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    const deleted = await deletePlatformTypeService(id);
    return res.json({ success: true, message: "Platform type deleted", data: deleted });
  } catch (err: any) {
    res.status(404).json({ success: false, message: err.message });
  }
};