import { createDepositAndAutoCaseRepository, getAllDepositRepository} from "../repository/deposit.repository";
import { CreateDepositInput } from "../validators/deposit.schema";

export const createDepositService = async (data: CreateDepositInput) => {
  const depositData = {
    ...data,
    deposit_at: data.deposit_at ?? new Date(), // Use current time if not provided
  };

  return await createDepositAndAutoCaseRepository(depositData);
};

export const getAllDepositService = async (
  page: number = 1,
  limit: number = 10,
  search: string = ''
) => {
  return await getAllDepositRepository(page, limit, search);
};