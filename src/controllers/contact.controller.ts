import { Request, Response, NextFunction } from "express";
import { createContactWithCaseAndDepositService, deleteContactService, getAllContactsService, getContactDetailService, updateContactService, uploadContactsCsvService } from "../services/contact.service";
import { ApiResponse } from "../types/api.type";
import {  ContactCreate, ContactWithDetails, PaginatedContacts } from "../types/contact.type";
import { ContactCreateSchema } from "../validators/contact.schema";
import { HttpStatus } from "../constants/httpStatus";

export const getAllContactsController = async (
  req: Request<{}, {}, {}, { page?: string; limit?: string; startDate?: string; endDate?: string }>,
  res: Response<ApiResponse<any>>,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "10", 10);
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    // Validate page and limit
    if (isNaN(page) || isNaN(limit) || page <= 0 || limit <= 0) {
      return res.status(400).json({
        success: false,
        message: "Page and limit must be positive integers.",
      });
    }

    // Validate dates if either is provided
    if ((startDate && !endDate) || (!startDate && endDate)) {
      return res.status(400).json({
        success: false,
        message: "Both startDate and endDate are required when filtering by date.",
      });
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const today = new Date();
      const maxStartDate = new Date();
      maxStartDate.setDate(today.getDate() - 90);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid date format for startDate or endDate.",
        });
      }
      if (start > end) {
        return res.status(400).json({
          success: false,
          message: "startDate cannot be after endDate.",
        });
      }
      if (start < maxStartDate) {
        return res.status(400).json({
          success: false,
          message: "startDate cannot be more than 90 days before today.",
        });
      }
      if (end > today) {
        return res.status(400).json({
          success: false,
          message: "endDate cannot be in the future.",
        });
      }
    }

    const result = await getAllContactsService(page, limit, startDate, endDate);

    return res.json({
      success: true,
      message: "Contacts fetched successfully",
      data: result,
    });
  } catch (err: any) {
    console.error("Error fetching contacts:", err);
    next(err); // send to global error handler
  }
};


export const getContactDetailController = async (
  req: Request<{ contactId: string }>,
  res: Response<ApiResponse<ContactWithDetails>>,
  next: NextFunction
) => {
  try {
    const contactId = Number(req.params.contactId);

    // Validate ID
    if (isNaN(contactId) || contactId <= 0 || !Number.isInteger(contactId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid contact ID format. Please provide a positive integer.",
      });
    }

    const contactDetail = await getContactDetailService(contactId);

    return res.status(200).json({
      success: true,
      message: "Contact detail fetched successfully",
      data: contactDetail,
    });
  } catch (err) {
    console.error("Error fetching contact detail:", err);
    next(err); // Let global error handler take over
  }
};

// export const createContactController = async (req: Request, res: Response<ApiResponse<any>>,next: NextFunction) =>{
//   try {
//     // Validate body with Zod
//     const parsed = ContactCreateSchema.safeParse(req.body);
//     if (!parsed.success) {
//       return res.status(400).json({
//         success: false,
//         message: "Validation failed",
//         errors: parsed.error.flatten(),
//       });
//     }

//    const newContact = await createContactService(parsed.data as ContactCreate);

//     return res.status(201).json({
//       success: true,
//       message: "Contact created successfully",
//       data: newContact,
//     });
//   } catch (err) {
//     next(err);
//   }
// }

export const createContactController = async (
  req: Request,
  res: Response<ApiResponse<any>>,
  next: NextFunction
) => {
  try {
    // Validate request body with Zod
    const parsed = ContactCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten(),
      });
    }

    // Call service
    const newContactData = await createContactWithCaseAndDepositService(parsed.data);

    return res.status(201).json({
      success: true,
      message: "Contact created successfully with case and deposit",
      data: newContactData,
    });
  } catch (err) {
    next(err);
  }
};

export const updateContactController = async (req:Request<{id: string}>,res: Response<ApiResponse<any>>, next: NextFunction) =>{
  try{
    const id = Number(req.params.id);
    if(isNaN(id) || id <= 0) return res.status(HttpStatus.BAD_REQUEST).json({success: false, message:"Invalid contact ID"});

    const updated = await updateContactService(id,req.body);
    if(!updated) return res.status(HttpStatus.NOT_FOUND).json({success:false,message:"Contact not found"});
    
    return res.json({success: true, message:"Contact updated successfully"})
  } catch(err){
    next(err)
  }
}

export const deleteContactController = async(req: Request, res:Response<ApiResponse<any>>, next: NextFunction) =>{

  try{
    const id = Number(req.params.id);
    if(isNaN(id) || id<= 0) return res.status(HttpStatus.BAD_REQUEST).json({success: false, message:"Invalid contact ID"});
  
    const deleted = await deleteContactService(id);
    if(!deleted) return res.status(HttpStatus.NOT_FOUND).json({success:false, message:"Contact not found"});
  
    return res.json({success: true, message:"Contact deleted successfully"});
  } catch(err){
    next(err)
  }

} 

export interface MulterRequest extends Request {
  file?: Express.Multer.File; // ✅ make optional
}

export const uploadContactsCsvController = async (
  req: Request,
  res: Response<ApiResponse<any>>,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "CSV file is required" });
    }

    const createdContacts = await uploadContactsCsvService(req.file.path);

    return res.json({
      success: true,
      message: `Successfully uploaded ${createdContacts.length} contacts`,
      data: createdContacts,
    });
  } catch (err) {
    next(err);
  }
};