import { db } from "../configs/db";
import { PaginateOptions, PaginationResult } from "../types/pagination.type";
import { UsernameUpdate } from "../types/username";
import { CreateUsername, Username } from "../types/username.type";
import { paginate } from "../utils/pagination";

// -----------------------
// Create
// -----------------------
export const createUsernameRepository = async (
  newUsername: Omit<CreateUsername, "register_date" | "last_deposit"> & {
    register_date?: Date;
    last_deposit?: Date;
  }
) => {
  const connection = await db.getConnection();
  await connection.beginTransaction();

  const now = new Date();

  try {
    // ✅ Check platform_id exists
    if (newUsername.platform_id !== undefined && newUsername.platform_id !== null) {
      const [platformCheck]: any = await connection.query(
        "SELECT platform_id FROM platforms WHERE platform_id = ?",
        [newUsername.platform_id]
      );
      if (!platformCheck || platformCheck.length === 0) {
        throw new Error(`Platform with ID ${newUsername.platform_id} does not exist`);
      }
    }

    // ✅ Check contact_id exists
    if (newUsername.contact_id !== undefined && newUsername.contact_id !== null) {
      const [contactCheck]: any = await connection.query(
        "SELECT contact_id FROM contacts WHERE contact_id = ?",
        [newUsername.contact_id]
      );
      if (!contactCheck || contactCheck.length === 0) {
        throw new Error(`Contact with ID ${newUsername.contact_id} does not exist`);
      }
    }

    // ✅ Insert username
    const [result]: any = await connection.query(
      `INSERT INTO usernames 
        (
          contact_id, 
          platform_id, 
          username, 
          username_status, 
          life_cycle, 
          register_date, 
          has_deposited, 
          last_deposit, 
          vip_level
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newUsername.contact_id,
        newUsername.platform_id ?? null,
        newUsername.username,
        newUsername.username_status,
        newUsername.life_cycle,
        newUsername.register_date ?? now,
        newUsername.has_deposited,
        newUsername.last_deposit ?? now,
        newUsername.vip_level,
      ]
    );

    await connection.commit();
    return result.insertId;
  } catch (err: any) {
    await connection.rollback();

    // ✅ Handle duplicate username
    if (err.code === "ER_DUP_ENTRY") {
      throw new Error(
        `Username '${newUsername.username}' already exists for platform ID ${newUsername.platform_id}`
      );
    }

    throw err;
  } finally {
    connection.release();
  }
};

// -----------------------
// Get all
// -----------------------
export async function getAllUsernameRepository(
    options: PaginateOptions
): Promise<PaginationResult<Username>> {    
    return paginate<Username>("usernames",{
        ...options,
        searchFields: ["username","username_status","life_cycle","username_status"]
    });
}


// -----------------------
// Update
// -----------------------
export const updateUsernameRepository = async (
  id: number,
  data: Partial<UsernameUpdate>
): Promise<number> => {
  // 1️⃣ Check if platform_id exists
  if (data.platform_id !== undefined && data.platform_id !== null) {
    const [platformCheck]: any = await db.query(
      "SELECT platform_id FROM platforms WHERE platform_id = ?",
      [data.platform_id]
    );

    if (!platformCheck || platformCheck.length === 0) {
      throw new Error(`Platform with ID ${data.platform_id} does not exist`);
    }
  }

  // 2️⃣ Check if contact_id exists
  if (data.contact_id !== undefined && data.contact_id !== null) {
    const [contactCheck]: any = await db.query(
      "SELECT contact_id FROM contacts WHERE contact_id = ?",
      [data.contact_id]
    );

    if (!contactCheck || contactCheck.length === 0) {
      throw new Error(`Contact with ID ${data.contact_id} does not exist`);
    }
  }

  // 3️⃣ Prepare update fields
  const fields: string[] = [];
  const values: any[] = [];

  for (const key in data) {
    fields.push(`${key} = ?`);
    values.push((data as any)[key]);
  }

  if (fields.length === 0) return 0; // nothing to update

  values.push(id);

  // 4️⃣ Execute update
  try {
    const [result]: any = await db.query(
      `UPDATE usernames SET ${fields.join(", ")} WHERE username_id = ?`,
      values
    );
    return result.affectedRows;
  } catch (error: any) {
    // Catch any foreign key errors
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      throw new Error('Referenced platform or contact does not exist');
    }
    throw error;
  }
};

// -----------------------
// Get by Id
// -----------------------
export const getUsernameByIdRepository = async (id: number) => {
    const [rows]: any = await db.query(
        `SELECT * FROM usernames WHERE username_id = ?`,
        [id]
    );
    return rows[0] || null;
}

// -----------------------
// Delete
// -----------------------
export const deleteUsernameRepository = async (id: number): Promise<number> => {
  const [result]: any = await db.query(
    `DELETE FROM usernames WHERE username_id = ?`,
    [id]
  );
  return result.affectedRows; // returns number of rows deleted
};
