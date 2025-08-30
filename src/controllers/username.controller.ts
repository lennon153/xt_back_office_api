import { Request, Response, NextFunction } from "express";
import { createUsernameService, deleteUsernameService, getAllUsernameService, getUsernameByIdService, updateUsernameService } from "../services/username.service";
import { ApiResponse } from "../types/api.type";
import { createUsernameSchema, updateUsernameSchema } from "../validators/username.schema";
import { HttpStatus } from "../constants/httpStatus";
import { ZodError } from "zod";

// -----------------------
// Create
// -----------------------
export const createUsernameController = async (
  req: Request,
  res: Response<ApiResponse<any>>
) => {
  try {
    const validatedData = createUsernameSchema.parse(req.body);
    const createdUsername = await createUsernameService(validatedData);

    return res.status(HttpStatus.CREATED).json({
      success: true,
      message: "Username created successfully",
      data: createdUsername,
    });
  } catch (err: any) {

    // Zod validation errors
    if (err instanceof ZodError) {
      const flattened = err.flatten();
      const errorMessages = Object.values(flattened.fieldErrors)
        .flat()
        .filter(Boolean);
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: "Validation failed",
        errors: errorMessages,
      });
    }

    // Duplicate username or invalid platform/contact
    if (
      err.message?.includes("already exists") ||
      err.message?.includes("Platform with ID") ||
      err.message?.includes("Contact with ID")
    ) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: err.message,
      });
    }

    console.error("Create error:", err);
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// -----------------------
// Get All
// -----------------------
export const getAllUsernameController = async (
    req: Request,
    res:Response<ApiResponse<any>>,
    next: NextFunction
) =>{
    try{
        const page = parseInt(req.params.page as string ) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string | undefined;
        const sortBy = (req.query.sortBy as string) || "register_date";
        const sortOrder = (req.query.sortOrder as "ASC" | "DESC") || "DESC";
    
        const result = await getAllUsernameService({
            page,
            limit,
            search,
            sortBy,
            sortOrder
        });
    
        return res.json({
            success: true,
            message:"Username retrieved successfully",
            data:{
                usernames: result.data
            },
            pagination: result.pagination
        })
    } catch(error){
        next(error)
    }
}

// -----------------------
// Update
// -----------------------
export const updateUsernameController = async (
  req: Request,
  res: Response<ApiResponse<any>>
) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: "Invalid username ID",
      });
    }

    // Validate request body
    const validatedData = updateUsernameSchema.parse(req.body);

    // Call service to update
    const updatedUsername = await updateUsernameService(id, validatedData);

    if (!updatedUsername) {
      return res.status(HttpStatus.NOT_FOUND).json({
        success: false,
        message: "Username not found",
      });
    }

    return res.json({
      success: true,
      message: "Updated successfully",
      data: updatedUsername,
    });
  } catch (err: any) {
    
    // Handle Zod validation errors
    if (err instanceof ZodError) {
      const flattened = err.flatten();
      const errorMessages = Object.values(flattened.fieldErrors)
        .flat()
        .filter(Boolean);

      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: "Validation failed",
        errors: errorMessages,
      });
    }

    // Handle repository errors for platform_id or contact_id
    if (
      err.message?.includes("Platform with ID") ||
      err.message?.includes("Contact with ID")
    ) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: err.message, // show exact message
      });
    }

    console.error("Update error:", err);
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// -----------------------
// Get by ID
// -----------------------
export const getUsernameByIdController = async (
  req: Request, 
  res: Response<ApiResponse<any>>
) => {
  try {
    const id = Number(req.params.id);
    const username = await getUsernameByIdService(id);
    if (!username) return res.status(HttpStatus.NOT_FOUND).json({ success: false, message: "Username not found" });
    return res.json({
      success: true, 
      message: "Username retrieved successfully",
      data: username, 
    });
  } catch {
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal server error" });
  }
};

// -----------------------
// Delete
// -----------------------
export const deleteUsernameController = async (
  req: Request,
  res: Response<ApiResponse<any>>
) => {
  try {
    const id = Number(req.params.id);
    const deletedRows = await deleteUsernameService(id);

    if (deletedRows === 0) {
      return res.status(HttpStatus.NOT_FOUND).json({
        success: false,
        message: "Username not found",
      });
    }

    return res.json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (err) {
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};