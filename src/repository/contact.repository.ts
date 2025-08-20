import { ResultSetHeader } from "mysql2";
import {db} from "../configs/db";
import { ContactCreate } from "../types/contact.type";

export const getAllContactsRepository = async (
  page: number = 1,
  limit: number = 10,
  search: string = ''
) => {
  const offset = (page - 1) * limit;

  let baseQuery = `FROM contacts `;
  const queryParams: any[] = [];

  if (search) {
    baseQuery += `WHERE full_name LIKE ? `;
    queryParams.push(`%${search}%`);
  }

  // Get total count
  const [countResult]: any = await db.query(
    `SELECT COUNT(*) as total ${baseQuery}`,
    queryParams
  );
  const total = countResult[0].total;

  // Get paginated data
  const [rows]: any = await db.query(
    `SELECT * ${baseQuery} ORDER BY contact_id DESC LIMIT ? OFFSET ?`,
    [...queryParams, limit, offset]
  );

  return { rows, total, page, limit };
};

export const getContactDetailByIdRepository = async (contactId: number) => {
  const [rows]: any = await db.query(
    `
    SELECT 
      c.contact_id,
      c.full_name,
      c.tel,
      c.contact_type,

      u.username_id,
      u.username,
      u.username_status,
      u.life_cycle,
      u.register_date,
      u.has_deposited,
      u.last_deposit,
      u.vip_level,

      p.platform_id,
      p.platform_name,
      
      pt.type_id,
      pt.type_name,

      cl.contact_id,
      cl.point_id,
      cl.staff_id,
      cl.call_status,
      cl.call_start_at,
      cl.call_end_at,
      cl.next_action_at
    FROM 
      contacts c
    JOIN 
      usernames u ON u.contact_id = c.contact_id
    JOIN 
      platforms p ON u.platform_id = p.platform_id
    JOIN 
      platform_types pt ON p.type_id = pt.type_id
    JOIN 
      call_logs cl ON cl.contact_id = c.contact_id
    WHERE 
      c.contact_id = ?
    ORDER BY u.register_date DESC
    `,
    [contactId]
  );

  return rows;
};

export const createContactRepository = async (contact: ContactCreate) => {
  const [result] = await db.query<ResultSetHeader>(
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

  return { id: result.insertId, ...contact };
};

// UPDATE
export const updateContactRepository = async (id: number, contact: Partial<ContactCreate>) => {
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
