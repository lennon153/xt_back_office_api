import { HttpStatus } from "../constants/httpStatus";
import { createDepositAndAutoCaseRepository, deleteDepositAndCaseRepository, getAllDepositRepository, getDepositsByCaseIdRepository, getDepositsByUserIdRepository, updateDepositAndCaseRepository} from "../repository/deposit.repository";
import { AppError } from "../utils/customError";
import { CreateDepositInput } from "../validators/deposit.schema";

// Create
export const createDepositService = async (data: CreateDepositInput) => {
  const depositData = {
    ...data,
    deposit_at: data.deposit_at ?? new Date(), // Use current time if not provided
  };

  return await createDepositAndAutoCaseRepository(depositData);
};

// Get all
export const getAllDepositService = async (
  page: number = 1,
  limit: number = 10,
  search: string = ''
) => {
  return await getAllDepositRepository(page, limit, search);
};

// Get deposit by Case ID
export const getDepositByCaseIdService = async (caseId: number) =>{
  return await getDepositsByCaseIdRepository(caseId);
}

// Update
export const updateDepositAndCaseService = async (
  depositId: number,
  data: Partial<CreateDepositInput>
) => {
  return await updateDepositAndCaseRepository(depositId, data);
};

// Delete
export const deleteDepositAndCaseService = async (depositId: number) => {
  return await deleteDepositAndCaseRepository(depositId);
};

// Get deposit by User ID
export const getDepositsByUserIdService = async (userId: string) =>{
  try{
    const deposits = await getDepositsByUserIdRepository(userId);
    if(!deposits) throw new AppError("Not found with user ID",HttpStatus.NOT_FOUND)
    return deposits;
  } catch(err: any){
    throw new Error(`Failed to retrieve deposits for user: ${err.message}`)
  }
}