import { db } from "../configs/db";
import { Case, CaseAssignment, CreateCase, UpdateCase } from "../types/case.type";
import { PaginateOptions, PaginationResult } from "../types/pagination.type";
import { paginate } from "../utils/pagination";
import { CreateCaseAssInput } from "../validators/case.schema";

// Create
export const createCaseRepository = async (newCase: CreateCase) => {
  const [result]: any = await db.query(
    `INSERT INTO cases 
      (contact_id, username_id, case_type, case_description, case_status, priority, create_at, update_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      newCase.contact_id,
      newCase.username_id,
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

// Get all
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

// create case + assign user in one repository function
export const createAndAssignCaseRepository = async (
  input: CreateCaseAssInput
): Promise<{ caseId: number; caseData: any }> => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Validate contact exists
    const [contactRows]: any = await conn.query(
      `SELECT contact_id FROM contacts WHERE contact_id = ?`,
      [input.contact_id]
    );
    if (!contactRows.length) throw new Error("Contact not found");

    // 2. Validate username if provided
    if (input.username_id) {
      const [usernameRows]: any = await conn.query(
        `SELECT username_id FROM usernames WHERE username_id = ?`,
        [input.username_id]
      );
      if (!usernameRows.length) throw new Error("Username not found");
    }

    // 3. Insert case with default last_deposit and has_deposit
    const [insertCaseResult]: any = await conn.query(
      `INSERT INTO cases 
        (contact_id, username_id, case_type, transaction_code, case_description, priority)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        input.contact_id,
        input.username_id ?? null,
        input.case_type,
        input.transaction_code ?? null,
        input.case_description ?? null,
        input.priority ?? "normal",
      ]
    );

    const caseId = insertCaseResult.insertId;

    // 4. Validate assigned user exists
    const [userRows]: any = await conn.query(
      `SELECT id FROM user WHERE id = ?`,
      [input.user_id]
    );
    if (!userRows.length) throw new Error("User not found");

    // 5. Insert assignment
    await conn.query(
      `INSERT INTO case_assignments (case_id, user_id, assignment_note)
       VALUES (?, ?, ?)`,
      [caseId, input.user_id, input.assignment_note ?? null]
    );

    // 6. Fetch full inserted case
    const [caseDataRows]: any = await conn.query(
      `SELECT * FROM cases WHERE case_id = ?`,
      [caseId]
    );

    await conn.commit();
    return { caseId, caseData: caseDataRows[0] };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const getCaseByIdRepository = async (id: number) =>{
  const [rows]: any = await db.query(
    `SELECT * FROM cases WHERE case_id = ?`,
    [id]
  )

  return rows[0] || null;
}
