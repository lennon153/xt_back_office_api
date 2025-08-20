import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../types/api.type";
import { PaginatedCase } from "../types/case.type";
import { HttpStatus } from "../constants/httpStatus";
import { createCaseService, deleteCaseService, getAllCasesService, updateCaseService } from "../services/case.service";
import { createCaseSchema, updateCaseSchema } from "../validators/case.schema";


export const createCaseController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createCaseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten(),
      });
    }

    const createdCase = await createCaseService(parsed.data);

    return res.status(201).json({
      success: true,
      message: "Case created successfully",
      data: createdCase,
    });
  } catch (err) {
    next(err);
  }
};



export const getAllCasesController = async(
    req:Request<{}, {} ,{}, { page?:string; limit?:string; search?: string}>,
    res:Response<ApiResponse<PaginatedCase>>,
    next:NextFunction
) =>{
    try{
        const page = parseInt(req.query.page || "1", 10);
        const limit = parseInt(req.query.limit || "10", 10);
        const search = req.query.search || "";

        if(page <= 0|| limit <= 0){
            return res.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                message:"Page and limit must be positive integers."
            });
        }

        const result = await getAllCasesService(page, limit, search);

        return res.json({
            success: true,
            message: "Cases fetched successfully",
            data: result,
        })
    } catch (err : any){
        console.error("Error fetching cases:",err)
        next(err);
    }
}

export const updateCaseController = async (
  req: Request<{ id: string }>,
  res: Response<ApiResponse<any>>,
  next: NextFunction
) => {
  try {
    const caseId = Number(req.params.id);

    if (isNaN(caseId) || caseId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid case ID",
      });
    }

    const parsed = updateCaseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten(),
      });
    }

    const updatedCase = await updateCaseService(caseId, parsed.data);

    return res.json({
      success: true,
      message: "Case updated successfully",
      data: updatedCase,
    });
  } catch (err) {
    next(err);
  }
};

// Delete case
export const deleteCaseController = async (req: Request<{ id: string }>, res: Response<ApiResponse<any>>, next: NextFunction) => {
  try {
    const caseId = Number(req.params.id);
    if (isNaN(caseId) || caseId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid case ID" });
    }

    const deletedCase = await deleteCaseService(caseId);

    return res.json({ success: true, message: "Case deleted successfully", data: deletedCase });
  } catch (err) {
    next(err);
  }
};