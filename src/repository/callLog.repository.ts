import { db } from "../configs/db";
import { HttpStatus } from "../constants/httpStatus";
import { AppError } from "../middlewares/errorHandler";
import { CallLogCreate } from "../types/callLog.type";


export const createCallLogRepository = async (
  newCallLog: Omit<CallLogCreate, "staff_id">,
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
        (contact_id, point_id, staff_id, call_status, call_note, call_start_at, call_end_at, next_action_at)
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
      staff_id: staffId,
      ...newCallLog,
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};
