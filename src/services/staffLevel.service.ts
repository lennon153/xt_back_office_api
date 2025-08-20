
import { db } from "../configs/db";
import { PaginatedStaffLevel, StaffLevel } from "../types/staffLevel";
import { ResultSetHeader, RowDataPacket } from "mysql2";

export const createStaffLevel = async (staffLevel: StaffLevel) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Insert new staff level
        const [result]: any = await connection.query(
            "INSERT INTO tbl_staff_levels (level_code, level_name) VALUES (?, ?)",
            [staffLevel.level_code, staffLevel.level_name]
        );

        await connection.commit();

        // Return the generated id
        return result.insertId;
    } catch (err) {
        // Rollback if any error occurs
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};

export const getAllStaffLevel = async(
    page: number = 1,
    limit: number = 10,
    search: string = ''
): Promise<PaginatedStaffLevel> => {

    const offset = (page - 1) * limit;

    let baseQuery = `FROM tbl_staff_levels`;
    const queryParams: any[] = [];

    if (search) {
        baseQuery += ` WHERE level_code LIKE ? OR level_name LIKE ?`;
        const searchParam = `%${search}%`;
        queryParams.push(searchParam, searchParam);
    }

    try {
        // Get total count
        const [countResult]: any = await db.query(
            `SELECT COUNT(*) as total ${baseQuery}`,
            queryParams
        );
        const total = countResult[0].total;

        // Get paginated data
        const [rows]: any = await db.query(
            `SELECT * ${baseQuery} ORDER BY level_code DESC LIMIT ? OFFSET ?`,
            [...queryParams, limit, offset]
        );

        const totalPages = Math.ceil(total / limit);
        const hasNext = page < totalPages;
        const hasPrevious = page > 1;

        return {
            data: rows.map((row: any) => ({
                id: row.id,
                level_code: row.level_code,
                level_name: row.level_name
            })),
            pagination: {
                total,
                totalPages,
                currentPage: page,
                limit,
                hasNext,
                hasPrevious
            }
        };

    } catch (error) {
        console.error('Error fetching staff levels', error);
        throw error;
    }
};

export const getStaffLevelById = async (id: number): Promise<StaffLevel | null> =>{
    const [rows] = await db.query<RowDataPacket[]>(
        "SELECT * FROM tbl_staff_levels WHERE id = ?",
        [id]
    );

    return (rows[0] as StaffLevel) || null;
}

export const updateStaffLevel = async (
  id: number,
  staffLevel: Partial<StaffLevel>
) => {
  const [result] = await db.query<ResultSetHeader>(
    `UPDATE tbl_staff_levels 
     SET level_code = ?, level_name = ?
     WHERE id = ?`,
    [staffLevel.level_code, staffLevel.level_name, id]
  );

  if (result.affectedRows === 0) {
    return null; // No row found with this id
  }

  // Return the updated row
  return {
    id,
    ...staffLevel,
  };
};

export const deleteStaffLevel = async(id: number) =>{
    const [result] = await db.query("DELETE FROM tbl_staff_levels WHERE id =? ", [id]);
    return result;
}