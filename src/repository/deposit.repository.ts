import { db } from "../configs/db";
import { CreateDepositInput } from "../validators/deposit.schema";

export const createDepositRepository = async (data: CreateDepositInput) => {
  
    // 1. Check if case exists
  const [caseRows]: any = await db.query(
    `SELECT id FROM cases WHERE id = ? LIMIT 1`,
    [data.case_id]
  );

  if (caseRows.length === 0) {
    throw new Error(`Case with id ${data.case_id} not found`);
  }

  // 2. Check if user exists
  const [userRows]: any = await db.query(
    `SELECT id FROM user WHERE id = ? LIMIT 1`,
    [data.user_id]
  );

  if (userRows.length === 0) {
    throw new Error(`User with id ${data.user_id} not found`);
  }

  // 3. Insert deposit
  const [result]: any = await db.query(
    `INSERT INTO deposits (case_id, deposit_code, user_id, amount, deposit_at) 
     VALUES (?, ?, ?, ?, ?)`,
    [
      data.case_id,
      data.deposit_code,
      data.user_id,
      data.amount,
      data.deposit_at,
    ]
  );

  return { id: result.insertId, ...data };
};