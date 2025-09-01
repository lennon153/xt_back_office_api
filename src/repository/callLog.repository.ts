import { db } from "../configs/db";
import { HttpStatus } from "../constants/httpStatus";
import { AppError } from "../middlewares/errorHandler";
import { CallLogCreate } from "../types/callLog.type";

// -----------------------
// Create
// -----------------------
export const createCallLogRepository = async (
  newCallLog: Omit<CallLogCreate, "user_id">,
  staffId: string
) => {
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // 1️⃣ Validate contact_id
    const [contact]: any = await connection.query(
      "SELECT contact_id FROM contacts WHERE contact_id = ?",
      [newCallLog.contact_id]
    );
    if (contact.length === 0) {
      throw new AppError("Invalid contact_id: not found in contacts", HttpStatus.BAD_REQUEST);
    }

    // 2️⃣ Validate point_id
    const [point]: any = await connection.query(
      "SELECT point_id FROM contact_points WHERE point_id = ?",
      [newCallLog.point_id]
    );
    if (point.length === 0) {
      throw new AppError("Invalid point_id: not found in contact_points", HttpStatus.BAD_REQUEST);
    }

    // 3️⃣ Insert log
    const [result]: any = await connection.query(
      `INSERT INTO call_logs
        (contact_id, point_id, user_id, call_status, call_note, call_start_at, call_end_at, next_action_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newCallLog.contact_id,
        newCallLog.point_id,
        staffId, // ✅ from session
        newCallLog.call_status,
        newCallLog.call_note,
        newCallLog.call_start_at,
        newCallLog.call_end_at,
        newCallLog.next_action_at,
      ]
    );

    await connection.commit();

    return {
      call_id: result.insertId,
      user_id: staffId,
      ...newCallLog,
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

// -----------------------
//  Get All
// -----------------------
export const getAllCallLogRepository = async (
  page: number = 1,
  limit: number = 20,
  search: string = ""
) => {
  const offset = (page - 1) * limit;

  const connection = await db.getConnection();
  try {
    let whereClause = "";
    let params: any[] = [];

    if (search && search.trim() !== "") {
      whereClause = `
        WHERE cl.call_status LIKE ?
        OR cl.call_note LIKE ?
        OR u.full_name LIKE ?
      `;
      const likeSearch = `%${search}%`;
      params.push(likeSearch, likeSearch, likeSearch);
    }

    // total count
    const [countRows]: any = await connection.query(
      `
        SELECT COUNT(*) as total
        FROM call_logs cl
        LEFT JOIN user u ON cl.user_id = u.id
        ${whereClause}
      `,
      params
    );

    const total = countRows[0].total;

    // fetch rows
    const [rows]: any = await connection.query(
      `
        SELECT cl.call_id, cl.contact_id, cl.point_id, cl.user_id, cl.call_status,
               cl.call_note, cl.call_start_at, cl.call_end_at, cl.next_action_at,
               u.name as staff_name
        FROM call_logs cl
        LEFT JOIN user u ON cl.user_id = u.id
        ${whereClause}
        ORDER BY cl.call_start_at DESC
        LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    return {
      data: rows,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        limit,
        hasNext: page * limit < total,
        hasPrevious: page > 1,
      },
    };
  } finally {
    connection.release();
  }
};

//------------------------------
// Get By ID
// -------------------------------
export const getCallLogByIdRepository = async (callId: number) => {
  const connection = await db.getConnection();
  try {
    const [rows]: any = await connection.query(
      `
        SELECT cl.call_id, cl.contact_id, cl.point_id, cl.user_id, cl.call_status,
               cl.call_note, cl.call_start_at, cl.call_end_at, cl.next_action_at,
               u.name as staff_name
        FROM call_logs cl
        LEFT JOIN user u ON cl.user_id = u.id
        WHERE cl.call_id = ?
      `,
      [callId]
    );
    console.log(callId)

    if (rows.length === 0) {
      throw new AppError("Call log not found", HttpStatus.NOT_FOUND);
    }

    return rows[0];
  } finally {
    connection.release();
  }
};

// -------------------------------
// Update
// -------------------------------
export const updateCallLogRepository = async (
  callId: number,
  updatedCall: Partial<{
    call_status: string;
    call_note: string;
    call_start_at: string | Date;
    call_end_at: string | Date;
    next_action_at: string | Date;
  }>
) => {
  const fields: string[] = [];
  const values: any[] = [];

  for (const key in updatedCall) {
    const value = updatedCall[key as keyof typeof updatedCall];
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (fields.length === 0) {
    throw new AppError("No fields provided to update", HttpStatus.BAD_REQUEST);
  }

  const [result]: any = await db.query(
    `UPDATE call_logs SET ${fields.join(", ")} WHERE call_id = ?`,
    [...values, callId]
  );

  if (result.affectedRows === 0) {
    throw new AppError("Call log not found", HttpStatus.NOT_FOUND);
  }

  // Return updated object
  const [updatedRows]: any = await db.query(
    `
      SELECT cl.call_id, cl.contact_id, cl.point_id, cl.user_id, cl.call_status,
             cl.call_note, cl.call_start_at, cl.call_end_at, cl.next_action_at,
             u.name as staff_name
      FROM call_logs cl
      LEFT JOIN user u ON cl.user_id = u.id
      WHERE cl.call_id = ?
    `,
    [callId]
  );

  return updatedRows[0];
};
// -------------------------------
// Delete
// -------------------------------
export const deleteCallLogRepository = async (callId: number) => {
  const connection = await db.getConnection();
  try {
    const [result]: any = await connection.query(
      "DELETE FROM call_logs WHERE call_id = ?",
      [callId]
    );

    if (result.affectedRows === 0) {
      throw new AppError("Call log not found", HttpStatus.NOT_FOUND);
    }

    return { message: "Call log deleted successfully" };
  } finally {
    connection.release();
  }
};
