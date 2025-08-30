import { HttpStatus } from "../constants/httpStatus";
import { createAndAssignCaseRepository, createCaseRepository, deleteCaseRepository, getCaseByIdRepository, getCasesRepository, updateCaseRepository } from "../repository/case.repository"
import { CaseResponse, CreateCase, UpdateCase } from "../types/case.type";
import { AppError } from "../utils/customError";
import { formatDateHour } from "../utils/dateFormat";
import { PaginateOptions, PaginationResult } from "../types/pagination.type";
import { autoAssignCase } from "../utils/case/autoTransfer";
import { CreateCaseAssInput } from "../validators/case.schema";


// -----------------------
// Create
// -----------------------
export const createCaseService = async (
  caseData: Omit<CreateCase, "create_at" | "update_at">
) => {
  const now = new Date();

  const newCase: CreateCase = {
    ...caseData,
    create_at: now,
    update_at: now,
  };

  // Insert case into DB
  const createdCase = await createCaseRepository(newCase);

  // ✅ Optionally: auto-assign staff here
  await autoAssignCase(createdCase.case_id);

  return createdCase;
};

// -----------------------
// Get All
// -----------------------
export async function getAllCasesService(
  options: PaginateOptions
): Promise<PaginationResult<CaseResponse>> {
  const result = await getCasesRepository(options);

  const formattedData = result.data.map((c) => ({
    ...c,
    create_at: c.create_at ? formatDateHour(new Date(c.create_at)) : null,
    update_at: c.update_at ? formatDateHour(new Date(c.update_at)) : null,
  }));

  return {
    ...result,
    data: formattedData,
  };
}

// -----------------------
// Update
// -----------------------
export const updateCaseService = async (
  caseId: number,
  updatedCase: UpdateCase
) => {
  const result = await updateCaseRepository(caseId, updatedCase);

  if (result.affectedRows === 0) {
    throw new AppError("Case not found", HttpStatus.NOT_FOUND);
  }

  return { case_id: caseId, ...updatedCase };
}

// -----------------------
// Delete
// -----------------------
export const deleteCaseService = async (caseId: number) =>{
    const result = await deleteCaseRepository(caseId);
    if(result.affectedRows=== 0){
        throw new AppError("Case not found",HttpStatus.NOT_FOUND);
    }
    return {case_id: caseId};
}

// -----------------------
// Create with assign case
// -----------------------
export const createAndAssignCaseService = async (input: CreateCaseAssInput) => {
  return await createAndAssignCaseRepository(input);
};

// -----------------------
// Get By Id
// -----------------------
export const getCaseByIdService = async(id: number) =>{
  const cases =  await getCaseByIdRepository(id);
  return cases
}