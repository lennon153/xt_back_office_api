import { db } from "../configs/db";
import { PlatformCreate, PlatformUpdate } from "../validators/platform.schema";

// -----------------------
// Get all
// -----------------------
export const getAllPlatformsRepository = async (
  page: number,
  limit: number,
  search?: string
) => {
  const offset = (page - 1) * limit;

  let baseQuery = `FROM platforms p INNER JOIN platform_types pt ON p.type_id = pt.type_id WHERE 1=1`;
  const params: any[] = [];

  if (search) {
    baseQuery += ` AND p.platform_name LIKE ?`;
    params.push(`%${search}%`);
  }

  const [countRows]: any = await db.query(`SELECT COUNT(*) as total ${baseQuery}`, params);
  const total = countRows[0].total;

  const [rows]: any = await db.query(
    `SELECT p.*, pt.type_name as type_name ${baseQuery} ORDER BY p.platform_id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return { data: rows, total };
};

// -----------------------
// Get by Id
// -----------------------
export const getPlatformByIdRepository = async (platform_id: number) => {
  const [rows]: any = await db.query(
    `SELECT p.*, pt.type_name as type_name FROM platforms p INNER JOIN platform_types pt ON p.type_id = pt.type_id WHERE p.platform_id = ?`,
    [platform_id]
  );
  return rows[0];
};

// -----------------------
// Create
// -----------------------
export const createPlatformRepository = async (data: PlatformCreate) => {
  // Validate type_id exists
  const [typeRows]: any = await db.query(
    `SELECT type_id FROM platform_types WHERE type_id = ?`,
    [data.type_id]
  );
  if (!typeRows.length) {
    throw new Error(`type_id ${data.type_id} does not exist in platform_types`);
  }

  const [result]: any = await db.query(
    `INSERT INTO platforms (type_id, platform_name) VALUES (?, ?)`,
    [data.type_id, data.platform_name]
  );
  return { platform_id: result.insertId, ...data };
};

// -----------------------
// Update
// -----------------------
export const updatePlatformRepository = async (
  platform_id: number, 
  data: PlatformUpdate
) => {
  const fields: string[] = [];
  const params: any[] = [];

  if (data.platform_name !== undefined) {
    fields.push("platform_name = ?");
    params.push(data.platform_name);
  }
  if (data.type_id !== undefined) {
    // Validate type_id exists
    const [typeRows]: any = await db.query(
      `SELECT type_id FROM platform_types WHERE type_id = ?`,
      [data.type_id]
    );
    if (!typeRows.length) {
      throw new Error(`type_id ${data.type_id} does not exist in platform_types`);
    }
    fields.push("type_id = ?");
    params.push(data.type_id);
  }

  if (!fields.length) return await getPlatformByIdRepository(platform_id);

  params.push(platform_id);

  await db.query(`UPDATE platforms SET ${fields.join(", ")} WHERE platform_id = ?`, params);

  return await getPlatformByIdRepository(platform_id);
};

// -----------------------
// Delete
// -----------------------
export const deletePlatformRepository = async (platform_id: number) => {
  const [result]: any = await db.query(`DELETE FROM platforms WHERE platform_id = ?`, [platform_id]);
  return { platform_id, affectedRows: result.affectedRows };
};