import { db } from "../configs/db";
import { PlatformType } from "../types/platformType.type";

// -----------------------
// Get All
// -----------------------
export const getAllPlatformsTypeRepository = async (
  page: number,
  limit: number,
  search?: string
): Promise<{ data: PlatformType[]; total: number }> => {
  const offset = (page - 1) * limit;

  let baseQuery = `FROM platform_types WHERE 1=1`;
  const params: any[] = [];

  if (search) {
    baseQuery += ` AND type_name LIKE ?`;
    params.push(`%${search}%`);
  }

  // Get total count
  const [countRows]: any = await db.query(`SELECT COUNT(*) as total ${baseQuery}`, params);
  const total = countRows[0].total;

  // Get paginated data in DESC order
  const [rows]: any = await db.query(
    `SELECT * ${baseQuery} ORDER BY type_id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return { data: rows, total };
};

// -----------------------
// Get By Id
// -----------------------
export const getPlatformTypeByIdRepository = async (id: number): Promise<PlatformType | null> => {
  const [rows]: any = await db.query(`SELECT * FROM platform_types WHERE type_id = ? LIMIT 1`, [id]);
  return rows.length ? rows[0] : null;
};

// -----------------------
// Create
// -----------------------
export const createPlatformTypeRepository = async (platform: Omit<PlatformType, "type_id">) => {
  const [result]: any = await db.query(
    `INSERT INTO platform_types (type_name) VALUES (?)`,
    [platform.type_name]
  );
  return { type_id: result.insertId, ...platform };
};

// -----------------------
// Update
// -----------------------
export const updatePlatformTypeRepository = async (id: number, platform: Partial<Omit<PlatformType, "type_id">>) => {
  const [result]: any = await db.query(
    `UPDATE platform_types SET type_name = ? WHERE type_id = ?`,
    [platform.type_name, id]
  );
  return result.affectedRows;
};

// -----------------------
// Delete
// -----------------------
export const deletePlatformTypeRepository = async (id: number) => {
  const [result]: any = await db.query(`DELETE FROM platform_types WHERE type_id = ?`, [id]);
  return result.affectedRows;
};