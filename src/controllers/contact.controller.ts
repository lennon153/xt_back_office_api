import { Request, Response, NextFunction } from "express";
import { getAllContactsService, getContactDetailService } from "../services/contact.service";
import { ApiResponse } from "../types/api.type";
import { ContactDetail, ContactWithDetails, PaginatedContacts } from "../types/contact.type";

export const getAllContactsController = async (
  req: Request<{}, {}, {}, { page?: string; limit?: string; search?: string }>,
  res: Response<ApiResponse<PaginatedContacts>>,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "10", 10);
    const search = req.query.search || "";

    if (page <= 0 || limit <= 0) {
      return res.status(400).json({
        success: false,
        message: "Page and limit must be positive integers.",
      });
    }

    const result = await getAllContactsService(page, limit, search);

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