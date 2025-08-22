import { db } from "../configs/db";
import { Case, CreateCase, UpdateCase } from "../types/case.type";
import { PaginateOptions, PaginationOptions, PaginationResult } from "../types/pagination.type";
import { paginate } from "../utils/pagination";

export const createCaseRepository = async (newCase: CreateCase) => {
  const [result]: any = await db.query(
    `INSERT INTO cases 
      (contact_id, username_id, case_type, case_description, case_status, priority, create_at, update_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      newCase.contact_id,
      newCase.username_id ?? null,
      newCase.case_type,
      newCase.case_description ?? null,
      newCase.case_status,
      newCase.priority,
      newCase.create_at,
      newCase.update_at,
    ]
  );

  return {
    case_id: result.insertId,
    ...newCase,
  };
};

export async function getCasesRepository(
  options: PaginateOptions
): Promise<PaginationResult<Case>> {
  return paginate<Case>("cases", {
    ...options,
    searchFields: ["case_description", "case_type", "case_status"], // define searchable columns per table
  });
}

// Update case
export const updateCaseRepository = async (
  caseId: number,
  updatedCase: UpdateCase
) => {
  const fields: string[] = [];
  const values: any[] = [];

  for (const key in updatedCase) {
    const k = key as keyof UpdateCase;
    if (updatedCase[k] !== undefined) {
      fields.push(`${k} = ?`);
      values.push(updatedCase[k]);
    }
  }

  // Always update timestamp
  fields.push(`update_at = ?`);
  values.push(new Date());

  const [result]: any = await db.query(
    `UPDATE cases SET ${fields.join(", ")} WHERE case_id = ?`,
    [...values, caseId]
  );

  return result;
};

// Delete case 
export const deleteCaseRepository = async (caseId: number)=>{
    const [result]: any = await db.query(
        `DELETE FROM cases WHERE case_id = ?`,
        [caseId]
    )

    return result;
}