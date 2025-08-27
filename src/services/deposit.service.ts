import { createDepositRepository } from "../repository/deposit.repository";
import { CreateDepositInput } from "../validators/deposit.schema";

export const createDepositService = async (data: CreateDepositInput) =>{
    return await createDepositRepository(data)
}