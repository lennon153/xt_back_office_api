import {db} from "../configs/db";

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
    `SELECT * ${baseQuery} ORDER BY create_at DESC LIMIT ? OFFSET ?`,
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
