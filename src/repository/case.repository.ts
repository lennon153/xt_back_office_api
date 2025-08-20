import { db } from "../configs/db";
import { CreateCase, UpdateCase } from "../types/case.type";

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

export const getAllCasesRepository = async (
    page: number = 1,
    limit: number = 10,
    search: string = ''
) => {
    const offset = (page - 1) * limit;

    let baseQuery = `FROM cases `;
    const queryParams: any[] = [];

    if (search) {
        baseQuery += `WHERE case_type LIKE ? OR case_status LIKE ? OR priority LIKE ? `;
        const searchParam = `%${search}%`;
        queryParams.push(searchParam, searchParam, searchParam);
    }

    // ✅ Get total count
    const [countResult]: any = await db.query(
        `SELECT COUNT(*) as total ${baseQuery}`,
        queryParams
    );

    const total = countResult[0].total;

    // ✅ Get paginated data
    const [rows]: any = await db.query(
        `SELECT * ${baseQuery} ORDER BY case_id DESC LIMIT ? OFFSET ?`,
        [...queryParams, limit, offset]
    );

    return { rows, total, page, limit };
};

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