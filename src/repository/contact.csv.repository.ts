import { db } from "../configs/db";
import { CallLog, Contact, Username } from "../types/contact.csv.type";


// upload file csv 
/**
 * Save a contact, its call log, and username in a single transaction.
 * @param contact Contact data
 * @param callLog CallLog data
 * @param username Username data
 * @returns Inserted contact ID
 */
export const saveAll = async (
  contact: Contact,
  callLog: CallLog,
  username: Username
): Promise<number> => {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // Insert into contacts
    const [contactResult]: any = await conn.query(
      `INSERT INTO contacts
        (tel, full_name, contact_type, register_date, last_call_at, personal_note, contact_line, create_at, update_at, deleted_at, dob)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        contact.tel ?? null,
        contact.full_name ?? null,
        contact.contact_type,
        contact.register_date ?? new Date(),
        contact.last_call_at ?? new Date(),
        contact.personal_note ?? '',
        contact.contact_line ?? '',
        contact.create_at ?? new Date(),
        contact.updated_at ?? new Date(),
        contact.deleted_at ?? null,
        contact.dob ?? null
      ]
    );

    const contactId = contactResult.insertId;

    // Insert into call_logs
    await conn.query(
    `INSERT INTO call_logs
        (contact_id, point_id, user_id, call_status, call_note, call_start_at, call_end_at, next_action_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
        contactId,
        callLog.point_id ?? null, // set null if undefined
        callLog.user_id ?? null,
        callLog.call_status,
        callLog.call_note ?? '',
        callLog.call_start_at ?? new Date(),
        callLog.call_end_at ?? new Date(),
        callLog.next_action_at ?? null
    ]
    );

    // Insert into usernames
    await conn.query(
      `INSERT INTO usernames
        (contact_id, platform_id, username, username_status, life_cycle, has_deposited, last_deposit, vip_level)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        contactId,
        username.platform_id ?? null,
        username.username,
        username.username_status ?? '',
        username.life_cycle ?? '',
        username.has_deposited ?? 0,
        username.last_deposit ?? new Date(),
        username.vip_level ?? 0
      ]
    );

    await conn.commit();
    return contactId;

  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};