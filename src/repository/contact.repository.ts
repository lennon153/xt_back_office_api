import { PoolConnection, ResultSetHeader } from "mysql2";
import {db} from "../configs/db";
import { ContactCreate } from "../types/contact.type";

// Get all
export const getAllContactsRepository = async (
  page: number = 1,
  limit: number = 10,
  startDate?: string,
  endDate?: string
) => {
  const offset = (page - 1) * limit;

  const today = new Date();
  const defaultStart = new Date();
  defaultStart.setDate(today.getDate() - 90); // last 90 days

  // Create dates in LOCAL Cambodia time (UTC+7)
  const start = startDate ? new Date(startDate) : defaultStart;
  const end = endDate ? new Date(endDate) : today;

  const whereQuery = `WHERE last_call_at BETWEEN ? AND ?`;
  const queryParams: any[] = [start, end];

  // Total count
  const [countResult]: any = await db.query(
    `SELECT COUNT(*) as total FROM contacts ${whereQuery}`,
    queryParams
  );
  const total = countResult[0]?.total ?? 0;

  // Paginated data
  const [rows]: any = await db.query(
    `SELECT * FROM contacts ${whereQuery} ORDER BY contact_id DESC LIMIT ? OFFSET ?`,
    [...queryParams, limit, offset]
  );

  return { rows, total, page, limit };
};

// Get Detail
export const getContactDetailByIdRepository = async (contactId: number) => {
  const [rows]: any = await db.query(
    `
    SELECT
      c.contact_id,
      c.tel,
      c.full_name,
      c.contact_type,
      c.register_date,
      c.last_call_at,
      c.last_call_status,
      c.personal_note,

      p.platform_id,
      p.platform_name,
      
      pt.type_id,
      pt.type_name,

      cp.point_id,
      cp.channel_code AS cp_channel_code,
      cp.value_raw,
      cp.value_norm,
      cp.is_primary,
      cp.verify_at,

      cl.call_id,
      cl.call_status,
      cl.call_note,
      cl.call_start_at,
      cl.call_end_at,
      cl.next_action_at,

      us.id,
      us.name,
      us.email,
      us.role,
      
      u.username_id,
      u.username,
      u.last_deposit,
      u.username_status,
      u.life_cycle,
      u.vip_level,
      u.platform_id,
        
      cc.channel_code,
      cc.channel_name

    FROM contacts c
    LEFT JOIN contact_points cp 
      ON cp.contact_id = c.contact_id
    LEFT JOIN call_logs cl 
      ON cl.contact_id = c.contact_id
      AND cl.point_id = cp.point_id
    LEFT JOIN user us 
      ON us.id = cl.user_id
    LEFT JOIN usernames u 
      ON u.contact_id = c.contact_id
    LEFT JOIN platforms p
      ON u.platform_id = p.platform_id
    LEFT JOIN platform_types pt
      ON p.type_id = pt.type_id
    LEFT JOIN contact_channels cc  
      ON cc.channel_code = cp.channel_code
    WHERE c.contact_id = ?
    ORDER BY cl.call_start_at DESC;
    `,
    [contactId]
  );

  return rows;
};

// Create 
export const createContactRepository = async (contact: ContactCreate) => {
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    const [result] = await connection.query<ResultSetHeader>(
      `INSERT INTO contacts 
        (tel, full_name, contact_type, register_date, last_call_at, dob, last_call_status, personal_note, contact_line, create_at, update_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        contact.tel,
        contact.full_name,
        contact.contact_type,
        contact.register_date,
        contact.last_call_at,
        contact.dob,
        contact.last_call_status,
        contact.personal_note,
        contact.contact_line,
        contact.create_at,
        contact.update_at,
      ]
    );

    await connection.commit();

    return { id: result.insertId, ...contact };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};


/**
 * Transaction-aware version of createCaseRepository
 */
// export const createCaseRepositoryTx = async (
//   conn: PoolConnection,
//   newCase: CreateCase
// ) => {
//   const [result] = await conn.query<ResultSetHeader>(
//     `INSERT INTO cases 
//       (contact_id, username_id, case_type, case_description, case_status, priority, create_at, update_at) 
//      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
//     [
//       newCase.contact_id,
//       newCase.username_id,
//       newCase.case_type,
//       newCase.case_description,
//       newCase.case_status,
//       newCase.priority,
//       newCase.create_at,
//       newCase.update_at,
//     ]
//   );

//   return { case_id: result.insertId, ...newCase };
// };

// /**
//  * Create Contact → Case(for that contact) → Deposit(for that case)
//  */
// export const createContactCaseAndDepositRepository = async (
//   contact: ContactCreate
// ) => {
//   const conn = await db.getConnection();
//   try {
//     await conn.beginTransaction();

//     // 1) Insert contact
//     const [contactRes] = await conn.query<ResultSetHeader>(
//       `INSERT INTO contacts 
//        (tel, full_name, contact_type, register_date, last_call_at, dob, last_call_status, personal_note, contact_line, create_at, update_at)
//        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//       [
//         contact.tel,
//         contact.full_name,
//         contact.contact_type,
//         contact.register_date,
//         contact.last_call_at,
//         contact.dob,
//         contact.last_call_status,
//         contact.personal_note,
//         contact.contact_line,
//         contact.create_at,
//         contact.update_at,
//       ]
//     );
//     const contact_id = contactRes.insertId;

//     // 2) Auto-create case
//     const casePayload: CreateCase = {
//       contact_id,
//       username_id: contact.username_id ?? null,
//       case_type: "deposit", // default type
//       case_description: "Auto-created case for new contact",
//       case_status: "pending",
//       priority: "normal",
//       create_at: contact.create_at,
//       update_at: contact.update_at,
//     };
//     const createdCase = await createCaseRepositoryTx(conn, casePayload);
//     const case_id = createdCase.case_id;

//     // 3) Auto-create deposit linked to case
//   const depositDate = contact.deposit_at ?? new Date(); // fallback to now if undefined
//   const [depRes] = await conn.query<ResultSetHeader>(
//     `INSERT INTO deposits (case_id, amount, deposit_at)
//     VALUES (?, ?, ?)`,
//     [
//       case_id,
//       0.0,            // default amount
//       depositDate,
//     ]
//   );
//   const deposit_id = depRes.insertId;

//     await conn.commit();

//     // 4) Auto-assign case (outside transaction, safe)
//     try {
//       await autoAssignCase(case_id, "Auto-assigned by system");
//     } catch (e) {
//       console.error("autoAssignCase failed:", e);
//     }

//     return {
//       contact: { contact_id, ...contact },
//       case: { ...createdCase },
//       deposit: {
//         deposit_id,
//         case_id,
//         contact_id,
//         amount: 0.0,
//         status: "pending",
//       },
//     };
//   } catch (err) {
//     await conn.rollback();
//     throw err;
//   } finally {
//     conn.release();
//   }
// };



// UPDATE
export const updateContactRepository = async (
  id: number, 
  contact: Partial<ContactCreate>
) => {
  const fields = Object.keys(contact);
  if (fields.length === 0) return null;

  const values = Object.values(contact).map(val => {
    if (val instanceof Date) return val; // already Date object

    // convert ISO string to MySQL datetime format
    if (typeof val === "string" && !isNaN(Date.parse(val))) {
      return new Date(val).toISOString().slice(0, 19).replace("T", " ");
    }
    return val;
  });

  const setClause = fields.map(f => `${f} = ?`).join(", ");

  const [result] = await db.query<ResultSetHeader>(
    `UPDATE contacts SET ${setClause} WHERE contact_id = ?`,
    [...values, id]
  );

  return result.affectedRows > 0;
};
;

// DELETE
export const deleteContactRepository = async (id: number) => {
  const [result] = await db.query<ResultSetHeader>(
    `DELETE FROM contacts WHERE contact_id = ?`,
    [id]
  );
  return result.affectedRows > 0;
};
