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

      s.staff_id,
      s.dept_code,
      s.level_code,
      s.full_name AS staff_name,
      s.email AS staff_email,
      s.join_date,

        
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
    LEFT JOIN staff s 
        ON s.staff_id = cl.staff_id
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
