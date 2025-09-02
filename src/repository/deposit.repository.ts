import { db } from "../configs/db";
import { CreateDepositInput } from "../validators/deposit.schema";

// Create
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
    // await connection.query(
    //   `UPDATE cases
    //    SET last_deposit = ?,
    //        has_deposit = IFNULL(has_deposit, 0) + 1,
    //        rotation_count = 0,
    //        update_at = NOW(),
    //        case_status = "closed"
    //    WHERE case_id = ?`,
    //   [depositAt, data.case_id]
    // );

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

// Get All
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
};

// Update 
export const updateDepositAndCaseRepository = async (
  depositId: number,
  data: Partial<CreateDepositInput>
) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Check if deposit exists
    const [depositRows]: any = await connection.query(
      `SELECT deposit_id, case_id, user_id FROM deposits WHERE deposit_id = ? LIMIT 1`,
      [depositId]
    );
    if (!depositRows.length) throw new Error(`Deposit with id ${depositId} not found`);
    const depositData = depositRows[0];

    // 2. Check if case exists (we need to check if the deposit case exists)
    const [caseRows]: any = await connection.query(
      `SELECT case_id, has_deposit FROM cases WHERE case_id = ? LIMIT 1`,
      [depositData.case_id]
    );
    if (!caseRows.length) throw new Error(`Case with id ${depositData.case_id} not found`);
    const caseData = caseRows[0];

    // 3. If deposit is updated, we reapply the changes
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (data.amount !== undefined) {
      updateFields.push("amount = ?");
      updateValues.push(data.amount);
    }

    if (data.currency !== undefined) {
      updateFields.push("currency = ?");
      updateValues.push(data.currency);
    }

    if (data.deposit_code !== undefined) {
      updateFields.push("deposit_code = ?");
      updateValues.push(data.deposit_code);
    }

    if (data.deposit_at !== undefined) {
      updateFields.push("deposit_at = ?");
      updateValues.push(data.deposit_at);
    }

    updateValues.push(depositId);

    if (updateFields.length === 0) {
      throw new Error("No valid fields provided for update");
    }

    const query = `UPDATE deposits SET ${updateFields.join(", ")} WHERE deposit_id = ?`;
    const [updateResult]: any = await connection.query(query, updateValues);

    if (updateResult.affectedRows === 0) {
      throw new Error(`Failed to update deposit with id ${depositId}`);
    }

    // 4. Update case status if deposit amount changed
    if (data.amount) {
      await connection.query(
        `UPDATE cases 
         SET last_deposit = NOW(),
             has_deposit = IFNULL(has_deposit, 0) + 1,
             update_at = NOW(),
             case_status = "closed"
         WHERE case_id = ?`,
        [depositData.case_id]
      );
    }

    await connection.commit();

    return {
      deposit_id: depositId,
      ...data,
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

//Delete
export const deleteDepositAndCaseRepository = async (depositId: number) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Get deposit details before deletion
    const [depositRows]: any = await connection.query(
      `SELECT case_id, deposit_at, amount, currency FROM deposits WHERE deposit_id = ? LIMIT 1`,
      [depositId]
    );
    if (!depositRows.length) throw new Error(`Deposit with id ${depositId} not found`);
    const depositData = depositRows[0];

    // 2. Delete the deposit from the deposits table
    const [deleteResult]: any = await connection.query(
      `DELETE FROM deposits WHERE deposit_id = ?`,
      [depositId]
    );

    if (deleteResult.affectedRows === 0) {
      throw new Error(`Failed to delete deposit with id ${depositId}`);
    }

    // 3. Update associated case (decrement has_deposit count)
    await connection.query(
      `UPDATE cases 
       SET has_deposit = GREATEST(0, IFNULL(has_deposit, 0) - 1),
           update_at = NOW()
       WHERE case_id = ?`,
      [depositData.case_id]
    );

    await connection.commit();

    return {
      message: `Deposit with id ${depositId} deleted successfully`,
      deleted_deposit: depositData,
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

// Get deposit by Case ID
export const getDepositsByCaseIdRepository = async (caseId: number) =>{
  const connection = await db.getConnection();
  try{
    const [rows]: any = await connection.query(
      `
      SELECT d.*, u.name as username
      FROM deposits d
      LEFT JOIN user u ON d.user_id = u.id
      WHERE d.case_id = ?
      ORDER BY d.deposit_at DESC
      `,[caseId]
    );
    return rows;
  } finally {
    connection.release();
  }
};

// Get deposit by User ID
export const getDepositsByUserIdRepository = async (userId: string) => {
  const connection = await db.getConnection();

  try {
    const [rows]: any = await connection.query(
      `SELECT d.*, c.case_status, c.case_description
       FROM deposits d
       LEFT JOIN cases c ON d.case_id = c.case_id
       WHERE d.user_id = ?
       ORDER BY d.deposit_at DESC`,
      [userId]  // Using userId as string in the query
    );
    return rows;
  } finally {
    connection.release();
  }
};