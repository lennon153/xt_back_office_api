import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { createContactPointService, deleteContactPointService, getAllContactPointService, updateContactPointService } from "../services/contactPoint.service";
import { ApiResponse } from "../types/api.type";
import { ContactPointUpdate, contactPointUpdateSchema, createContactPointSchema } from "../validators/contactPoint.schema";


export const createContactPointController = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    // 1. Validate input with Zod
    const input = createContactPointSchema.parse(req.body);

    // 2. Call service to create the contact point
    const newPoint = await createContactPointService(input);

    // 3. Return success response
    return res.status(201).json({
      success: true,
      message: "Contact point created successfully",
      data: newPoint,
    });
  } catch (err: any) {
    // 4. Handle Zod validation errors
    if (err instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        data: err.issues.map(issue => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    // 5. Handle repository/business errors
    if (err.message === "Contact not found") {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    if (err.message.startsWith("Invalid channel_code")) {
      return res.status(400).json({
        success: false,
        message: err.message, // e.g., "Invalid channel_code: XYZ"
      });
    }

    // 6. Fallback: unexpected server error
    console.error("Unexpected error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
export const getAllContactPointController = async (
  req: Request,
  res: Response<ApiResponse<any>>,
  next: NextFunction
) =>{
  try{
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string | undefined;
    const sortBy = (req.query.sortBy as string)|| "create_at";
    const sortOrder = (req.query.sortOrder as "ASC" | "DESC") ||  "DESC";

    const result = await getAllContactPointService({
      page,
      limit,
      search,
      sortBy,
      sortOrder,
    });

    return res.json({
      success: true,
      message: "Contact point retrieved successfully",
      data: {
        contact_points: result.data,
      },
      pagination: result.pagination,
    })
  } catch (error){
    next(error)
  }
}

// -----------------------
// Update contact point
// -----------------------
export const updateContactPointController = async (
  req: Request<{ id: string }>,
  res: Response<ApiResponse<any>>,
  next: NextFunction
) => {
  try {
    const contactPointId = Number(req.params.id);

    if (isNaN(contactPointId) || contactPointId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid contact point ID",
      });
    }

    // 1. Validate input using Zod
    const parsedResult = contactPointUpdateSchema.safeParse(req.body);
    if (!parsedResult.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsedResult.error.flatten(),
      });
    }

    const parsed: ContactPointUpdate = parsedResult.data;

    // 2. Call service to update
    const updated = await updateContactPointService(contactPointId, parsed);

    // 3. Return success response
    return res.json({
      success: true,
      message: "Contact point updated successfully",
      data: updated,
    });
  } catch (err: any) {
    // 4. Handle known errors from repository/service
    if (err.message === "Contact not found") {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    if (err.message.startsWith("Invalid channel_code")) {
      return res.status(400).json({
        success: false,
        message: err.message, // e.g., "Invalid channel_code: XYZ"
      });
    }

    if (err.message.startsWith("Invalid foreign key value")) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    // 5. Handle unexpected errors
    console.error("Unexpected error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// -----------------------
// Delete contact point
// -----------------------
export const deleteContactPointController = async (
  req: Request<{ id: string }>,
  res: Response<ApiResponse<any>>,
  next: NextFunction
) => {
  try {
    const contactPointId = Number(req.params.id);

    if (isNaN(contactPointId) || contactPointId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid contact point ID",
      });
    }

    const deleted = await deleteContactPointService(contactPointId);

    return res.json({
      success: true,
      message: "Contact point deleted successfully",
      data: deleted, // contains { point_id, affectedRows }
    });
  } catch (err: any) {
    // Handle known errors
    if (err.message === "Contact point not found") {
      return res.status(404).json({
        success: false,
        message: "Contact point not found",
      });
    }

    // Fallback for unexpected errors
    console.error("Unexpected error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};