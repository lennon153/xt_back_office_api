import ca from "zod/v4/locales/ca.js";
import { HttpStatus } from "../constants/httpStatus";
import { createCaseRepository, deleteCaseRepository, getAllCasesRepository, updateCaseRepository } from "../repository/case.repository"
import { CreateCase, UpdateCase } from "../types/case.type";
import { AppError } from "../utils/customError";
import { formatDateHour } from "../utils/dateFormat";


export const createCaseService = async (
  caseData: Omit<CreateCase, "create_at" | "update_at">
) => {
  const now = new Date();

  const newCase: CreateCase = {
    ...caseData,
    create_at: now,
    update_at: now,
  };

  const createdCase = await createCaseRepository(newCase);
  return createdCase;
};

export const getAllCasesService = async (
    page: number = 1,
    limit: number = 10,
    search: string = ''
) =>{
    try{
        const {rows , total } = await getAllCasesRepository(page, limit, search);

        const totalPage = Math.ceil(total / limit);
        const hasNext = page < totalPage;
        const hasPrevious = page>1

        return{
            cases: rows.map((row: any)=>({
                case_id: row.case_id,
                contact_id: row.contact_id,
                username_id: row.username_id,
                case_type: row.case_type,
                case_description: row.case_description,
                case_status:row.case_status,
                priority: row.priority,
                create_at: row.create_at ? formatDateHour(new Date(row.create_at)): null,
                update_at: row.update_at ? formatDateHour(new Date(row.update_at)): null
            })),
            pagination:{
                total,
                totalPage,
                currentPage: page,
                limit,
                hasNext,
                hasPrevious
            },
        };
    } catch(e){
        console.log("Error fetching cases:",e);
        throw new AppError("Cases not found",HttpStatus.NOT_FOUND);
    }
}

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
export const deleteCaseService = async (caseId: number) =>{
    const result = await deleteCaseRepository(caseId);
    if(result.affectedRows=== 0){
        throw new AppError("Case not found",HttpStatus.NOT_FOUND);
    }
    return {case_id: caseId};
}