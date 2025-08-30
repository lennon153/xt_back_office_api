import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../types/api.type";
import { contactChannelSchema, updateContactChannelSchema } from "../validators/contactChannelSchema";
import { HttpStatus } from "../constants/httpStatus";
import { createContactChannelService, deleteContactChannelService, getAllContactChannelsService, getContactChannelByCodeService, updateContactChannelService } from "../services/contactChannelService.service";
import { ZodError } from "zod";

// Create
export const createContactChannelController = async (
  req: Request,
  res: Response<ApiResponse<any>>,
  next: NextFunction
) => {
  try {
    const parsed = contactChannelSchema.parse(req.body);
    const created = await createContactChannelService(parsed);

    return res.json({
      success: true,
      message: "Contact channel created successfully",
      data: created,
    });
  } catch (err: any) {
    // ✅ Zod validation errors
    if (err instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: err.issues.map(issue => issue.message).join(", "),
        errors: err.issues.map(issue => ({
          path: issue.path.join("."),
          message: issue.message
        }))
      });
    }

    // Duplicate channel code
    if (err.message === "Channel code already exists") {
      return res.status(409).json({ success: false, message: err.message });
    }

    console.error("Unexpected error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Gat all
export const getAllContactChannelsController = async (
  req: Request,
  res: Response<ApiResponse<any>>,
  next: NextFunction
) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 10, 1);
    const search = (req.query.search as string) || undefined;

    const result = await getAllContactChannelsService(page, limit, search);

    return res.json({
      success: true,
      message: "Contact channels fetched successfully",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (err) {
    console.error("Error fetching contact channels:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get by code
export const getContactChannelByCodeController = async(
    req: Request<{code: string}>,
    res:Response<ApiResponse<any>>,
    next:NextFunction
)=>{
    try{
        const {code} = req.params;
        const channel = await getContactChannelByCodeService(code)
        return res.json({
            success:true,
            message:"Fetch contact channel successfully",
            data:channel
        })
    }catch( err: any){
        if( err.message === "Contact channel not found"){
            return res.status(HttpStatus.NOT_FOUND).json({
                success:false,
                message: err.message
            })
        };
        console.error("Unexpected  error:", err);
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Internal server error"
        })
    }
}

// Update 
export const updateContactChannelController = async (
  req: Request<{ code: string }>,
  res: Response<ApiResponse<any>>,
  next: NextFunction
) => {
  try {
    const { code } = req.params;
    const parsed = updateContactChannelSchema.partial().parse(req.body);
    const updated = await updateContactChannelService(code, parsed);

    return res.json({
      success: true,
      message: "Contact channel updated successfully",
      data: updated,
    });
  } catch (err: any) {
    if (err.errors) {
      return res.status(400).json({ success: false, message: err.errors[0].message });
    }
    if (err.message === "Contact channel not found") {
      return res.status(404).json({ success: false, message: err.message });
    }
    console.error("Unexpected error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Delete
export const deleteContactChannelController = async (
  req: Request<{ code: string }>,
  res: Response<ApiResponse<any>>,
  next: NextFunction
) => {
  try {
    const { code } = req.params;
    const deleted = await deleteContactChannelService(code);

    return res.json({
      success: true,
      message: "Contact channel deleted successfully",
      data: deleted,
    });
  } catch (err: any) {
    if (err.message === "Contact channel not found") {
      return res.status(404).json({ success: false, message: err.message });
    }
    console.error("Unexpected error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
