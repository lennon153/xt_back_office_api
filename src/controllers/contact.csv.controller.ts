import { Request, Response } from "express";
import { ApiResponse } from "../types/api.type";
import { uploadCSVService } from "../services/contact.csv.service";

// -----------------------
// Upload file csv
// -----------------------
export const uploadCSVController = async (
  req: Request, 
  res: Response
) => {
  const response: ApiResponse = { success: false, message: "", data: null };

  try {
    if (!req.file) {
      response.message = "No file uploaded";
      return res.status(400).json(response);
    }

    const result = await uploadCSVService(req.file.path);

    response.success = result.errors.length === 0;
    response.message = result.errors.length === 0 
      ? "CSV uploaded successfully"
      : `CSV uploaded with ${result.errors.length} error(s)`;
    response.data = result;

    res.status(result.errors.length > 0 ? 400 : 200).json(response);

  } catch (err: any) {
    response.message = "Upload failed";
    response.errors = err.message || err;
    res.status(500).json(response);
  }
};