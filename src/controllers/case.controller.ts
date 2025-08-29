import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../types/api.type";
import { createAndAssignCaseService, createCaseService, deleteCaseService,  getAllCasesService, getCaseByIdService, updateCaseService } from "../services/case.service";
import { createCaseAssSchema, createCaseSchema, updateCaseSchema } from "../validators/case.schema";
import { ZodError } from "zod";
import { HttpStatus } from "../constants/httpStatus";


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


export const getAllCasesController = async (
  req: Request,
  res: Response<ApiResponse<any>>,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;
    const priority = req.query.priority as string | undefined;
    const sortBy = (req.query.sortBy as string) || "create_at";
    const sortOrder = (req.query.sortOrder as "ASC" | "DESC") || "DESC";

    const result = await getAllCasesService({
      page,
      limit,
      search,
      filters: {
        ...(status && { case_status: status }),
        ...(priority && { priority }),
      },
      sortBy,
      sortOrder,
    });

    return res.json({
      success: true,
      message: "Cases retrieved successfully",
      data: {
        cases :result.data
      }, 
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

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


export const createCaseAssController = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const input = createCaseAssSchema.parse(req.body);
    const caseId = await createAndAssignCaseService(input);

    return res.status(201).json({
      success: true,
      message: "Case created and assigned successfully",
      data: { case_id: caseId },
    });
  } catch (err: any) {
    // Validation errors
    if (err instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        data: err.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    // Business errors
    if (err.message === "Contact not found") {
      return res.status(404).json({ success: false, message: "Contact not found" });
    }
    if (err.message === "User not found") {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (err.message === "Username not found") {
      return res.status(404).json({ success: false, message: "Username not found" });
    }

    // Unexpected server error
    console.error("Unexpected error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getCaseByIdController = async(req:Request, res:Response<ApiResponse<any>>, next: NextFunction)=>{
  try{
    const id = Number(req.params.id);
    const cases = await getCaseByIdService(id);
    if(!cases) return res.status(HttpStatus.NOT_FOUND).json({success:false, message:"Case not found"})
      return res.json({
        success:true,
        message:"Get case by id successfully",
        data:cases,
    });
  }catch(err){
    next(err)
  }
}