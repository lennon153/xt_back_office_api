import { db } from "../configs/db";
import { CreateDepositInput } from "../validators/deposit.schema";

export const createDepositAndAutoCaseRepository = async (data: CreateDepositInput) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Check if case exists
    const [caseRows]: any = await connection.query(
      `SELECT case_id, has_deposit, username_id FROM cases WHERE case_id = ? LIMIT 1`,
      [data.case_id]
    );
    if (!caseRows.length) throw new Error(`Case with id ${data.case_id} not found`);
    const caseData = caseRows[0];

    // 2. Check if user exists
    const [userRows]: any = await connection.query(
      `SELECT id FROM user WHERE id = ? LIMIT 1`,
      [data.user_id]
    );
    if (!userRows.length) throw new Error(`User with id ${data.user_id} not found`);

    const depositAt = data.deposit_at || new Date();

    // 3. Insert deposit
    const [depositResult]: any = await connection.query(
      `INSERT INTO deposits (case_id, deposit_code, user_id, amount, currency, deposit_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.case_id,
        data.deposit_code,
        data.user_id,
        data.amount,
        data.currency,
        depositAt,
      ]
    );

    // 4. Update current case
    await connection.query(
      `UPDATE cases
       SET last_deposit = ?,
           has_deposit = IFNULL(has_deposit, 0) + 1,
           rotation_count = 0,
           update_at = NOW(),
           case_status = "closed"
       WHERE case_id = ?`,
      [depositAt, data.case_id]
    );

    // 5. Auto-create a new pending case for the same user
    const [newCaseResult]: any = await connection.query(
      `
        INSERT INTO cases 
            (contact_id, username_id, case_type, priority, case_description, case_status, last_deposit, has_deposit, create_at, update_at)
        SELECT 
            contact_id, 
            username_id, 
            case_type, 
            priority, 
            CONCAT(case_description, ' (new case)') AS case_description,
            'pending' AS case_status,
            NOW() AS last_deposit,
            0 AS has_deposit,
            NOW() AS create_at,
            NOW() AS update_at
        FROM cases 
        WHERE case_id = ?
      `,
      [data.case_id]
    );

    // 6. Insert initial assignment for new case
    await connection.query(
      `INSERT INTO case_assignments (case_id, user_id, assign_at, assignment_note)
       VALUES (?, ?, NOW(), ?)`,
      [newCaseResult.insertId, data.user_id, "Auto-created after deposit"]
    );

    await connection.commit();

    return {
      deposit_id: depositResult.insertId,
      new_case_id: newCaseResult.insertId,
      ...data,
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};


export const getAllDepositRepository = async (
  page: number = 1,
  limit: number = 20,
  search: string = ''
) => {
  const offset = (page - 1) * limit;
  const queryParams: any[] = [];

  let whereClause = '';
  if (search) {
    whereClause = `WHERE d.deposit_code LIKE ? OR s.name LIKE ? OR c.full_name LIKE ?`;
    const searchParam = `%${search}%`;
    queryParams.push(searchParam, searchParam, searchParam);
  }

  const [rows]: any = await db.query(
    `
      SELECT 
        d.deposit_id,
        d.deposit_code,
        d.amount,
        d.currency,
        d.deposit_at,
        d.case_id,
        s.id AS user_id,
        s.name AS user_name,
        c.contact_id,
        c.full_name AS contact_name
      FROM deposits d
      LEFT JOIN user s ON d.user_id = s.id
      LEFT JOIN cases ca ON d.case_id = ca.case_id
      LEFT JOIN contacts c ON ca.contact_id = c.contact_id
      ${whereClause}
      ORDER BY d.deposit_at DESC
      LIMIT ? OFFSET ?
    `,
    [...queryParams, limit, offset]
  );

  // Total count for pagination
  const [countRows]: any = await db.query(
    `SELECT COUNT(*) as total FROM deposits d
     LEFT JOIN user s ON d.user_id = s.id
     LEFT JOIN cases ca ON d.case_id = ca.case_id
     LEFT JOIN contacts c ON ca.contact_id = c.contact_id
     ${whereClause}`,
    queryParams
  );

  const total = countRows[0].total;
  const totalPages = Math.ceil(total / limit);

  return {
    data: rows,
    pagination: {
      total,
      totalPages,
      currentPage: page,
      limit,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    },
  };
}