
import { HttpStatus } from "../constants/httpStatus";
import { createContactPointRepository, deleteContactPointRepository, getAllContactPointRepository, getContactPointByIdRepository, updateContactPointRepository } from "../repository/contactPoint.repository";
import { ContactPointResponse, ContactPointUpdate } from "../types/contactPoint.type";
import { PaginateOptions, PaginationResult } from "../types/pagination.type";
import { AppError } from "../utils/customError";
import { formatDateHour } from "../utils/dateFormat";
import {  CreateContactPointInput } from "../validators/contactPoint.schema";

export const createContactPointService = async (input: CreateContactPointInput) => {
  return await createContactPointRepository(input);
};

export async function getAllContactPointService(
  options: PaginateOptions
): Promise<PaginationResult<ContactPointResponse>>{
  
  const result = await getAllContactPointRepository(options)
  
  const formattedData = result.data.map((cp)=>({
    ...cp,
    verify_at: cp.create_at? formatDateHour(new Date(cp.verify_at)) : null,
    create_at: cp.create_at? formatDateHour(new Date(cp.create_at)) : null,
    update_at: cp.update_at? formatDateHour(new Date(cp.update_at)) : null,
  }));


  return {
    ...result,
    data: formattedData,
  }; 
}


// -----------------------
// Update
// -----------------------
export const updateContactPointService = async (
  contactPointId: number,
  updatedData: ContactPointUpdate
) => {
  try {
    const result = await updateContactPointRepository(contactPointId, updatedData);

    if (result.affectedRows === 0) {
      throw new AppError("Contact point not found", HttpStatus.NOT_FOUND);
    }

    return { contact_id: contactPointId, ...updatedData };
  } catch (err: any) {
    // Handle MySQL foreign key error
    if (err.code === "ER_NO_REFERENCED_ROW_2") {
      throw new AppError(
        `Invalid foreign key value: ${err.sqlMessage}`,
        HttpStatus.BAD_REQUEST
      );
    }

    // Handle duplicate key errors (optional)
    if (err.code === "ER_DUP_ENTRY") {
      throw new AppError(
        `Duplicate entry: ${err.sqlMessage}`,
        HttpStatus.BAD_REQUEST
      );
    }

    // Re-throw other errors
    throw err;
  }
};

// -----------------------
// Delete
// -----------------------
export const deleteContactPointService = async (PointId: number) => {
  const result = await deleteContactPointRepository(PointId);
  return result;
};

// Get service
export const getContactPointByIdService = async (PointId: number) => {
  const contactPoint = await getContactPointByIdRepository(PointId);
  return contactPoint;
};