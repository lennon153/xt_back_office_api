import { db } from "../configs/db";
import { ContactPoint, ContactPointUpdate } from "../types/contactPoint.type";
import { PaginateOptions, PaginationResult } from "../types/pagination.type";
import { paginate } from "../utils/pagination";
import { CreateContactPointInput } from "../validators/contactPoint.schema";

// Create contact point
export const createContactPointRepository = async (input: CreateContactPointInput) => {
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // 1. Validate contact
    const [contactRows]: any = await connection.query(
      `SELECT contact_id FROM contacts WHERE contact_id = ?`,
      [input.contact_id]
    );
    if (!contactRows.length) throw new Error("Contact not found");

    // 2. Validate channel_code
    const [channelRows]: any = await connection.query(
      `SELECT channel_code FROM contact_channels WHERE channel_code = ?`,
      [input.channel_code]
    );
    if (!channelRows.length) throw new Error(`Invalid channel_code: ${input.channel_code}`);

    // 3. Insert contact point
    const [result]: any = await connection.query(
      `INSERT INTO contact_points 
        (contact_id, channel_code, value_raw, value_norm, is_primary, verify_at, create_at, update_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        input.contact_id,
        input.channel_code,
        input.value_raw,
        input.value_norm,
        input.is_primary ? 1 : 0,
        input.verify_at ?? null,
      ]
    );

    await connection.commit();

    return {
      point_id: result.insertId,
      ...input,
      is_primary: input.is_primary ? 1 : 0,
    };
  } catch (err: any) {
    await connection.rollback();

    if (err.code === "ER_DUP_ENTRY") {
      throw new Error(
        `Duplicate entry '${input.channel_code}-${input.value_norm}' for key 'contact_points.uq_contact_point'`
      );
    }

    throw err;
  } finally {
    connection.release();
  }
};

// Get All contact points
export async function getAllContactPointRepository(
  options: PaginateOptions
): Promise<PaginationResult<ContactPoint>> {
  return paginate<ContactPoint>("contact_points",{
    ...options,
    searchFields:["channel_code", "value_raw", "value_norm"]
  });
  
}

// -----------------------
// Update
// -----------------------
export const updateContactPointRepository = async (
  contactPointId: number,
  updatedData: ContactPointUpdate
) => {
  const fields: string[] = [];
  const values: any[] = [];

  // 1. Validate contact_id exists (if provided)
  if (updatedData.contact_id !== undefined) {
    const [contactRows]: any = await db.query(
      `SELECT contact_id FROM contacts WHERE contact_id = ?`,
      [updatedData.contact_id]
    );
    if (!contactRows.length) {
      throw new Error("Contact not found");
    }
  }

  // 2. Validate channel_code exists (if provided)
  if (updatedData.channel_code !== undefined) {
    const [channelRows]: any = await db.query(
      `SELECT channel_code FROM contact_channels WHERE channel_code = ?`,
      [updatedData.channel_code]
    );
    if (!channelRows.length) {
      throw new Error(`Invalid channel_code: ${updatedData.channel_code}`);
    }
  }

  // 3. Build dynamic SET clause
  for (const key in updatedData) {
    const k = key as keyof ContactPointUpdate;
    if (updatedData[k] !== undefined) {
      fields.push(`${k} = ?`);
      values.push(updatedData[k]);
    }
  }

  if (fields.length === 0) {
    throw new Error("No fields provided to update");
  }

  // Always update timestamp
  fields.push(`update_at = NOW()`);

  try {
    const [result]: any = await db.query(
      `UPDATE contact_points SET ${fields.join(", ")} WHERE point_id = ?`,
      [...values, contactPointId]
    );

    return result;
  } catch (err: any) {
    // Handle foreign key constraint error gracefully
    if (err.code === "ER_NO_REFERENCED_ROW_2") {
      throw new Error(`Invalid foreign key value: ${err.sqlMessage}`);
    }
    throw err;
  }
};

// -----------------------
// Delete
// -----------------------
export const deleteContactPointRepository = async (pointId: number) => {
  const [result]: any = await db.query(
    `DELETE FROM contact_points WHERE point_id = ?`,
    [pointId]
  );

  // Check if any row was deleted
  if (result.affectedRows === 0) {
    throw new Error("Contact point not found");
  }

  return {
    point_id: pointId,
  };
}

// -----------------------
// Get By Id
// -----------------------
export const getContactPointByIdRepository = async (contact_id: number) => {
  const [rows]: any = await db.query(
    `SELECT * FROM contact_points WHERE contact_id = ?`,
    [contact_id]
  );
  return rows.length > 0 ? rows[0] : null;
};