import { db } from "../configs/db";
import { PaginateOptions, PaginationOptions, PaginationResult } from "../types/pagination.type";

export async function paginate<T>(
  tableName: string,
  options: PaginateOptions,
  transform?: (row: any) => T
): Promise<PaginationResult<T>> {
  const {
    page = 1,
    limit = 10,
    search,
    searchFields = [],
    filters = {},
    sortBy,
    sortOrder = "ASC",
  } = options;

  const offset = (page - 1) * limit;
  const conditions: string[] = [];
  const params: any[] = [];

  // Filters
  for (const key in filters) {
    if (filters[key] !== undefined) {
      conditions.push(`${key} = ?`);
      params.push(filters[key]);
    }
  }

  // Search
  if (search && searchFields.length > 0) {
    const searchConditions = searchFields.map((field) => `${field} LIKE ?`).join(" OR ");
    conditions.push(`(${searchConditions})`);
    searchFields.forEach(() => params.push(`%${search}%`));
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const orderClause = sortBy ? `ORDER BY ${sortBy} ${sortOrder}` : "";

  // Total count
  const [countRows]: any = await db.query(`SELECT COUNT(*) as total FROM ${tableName} ${whereClause}`, params);
  const total = countRows[0]?.total || 0;

  // Data
  const [rows]: any = await db.query(
    `SELECT * FROM ${tableName} ${whereClause} ${orderClause} LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const data = transform ? (rows as any[]).map(transform) : (rows as T[]);
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      total,
      totalPages,
      currentPage: page,
      limit,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    },
  };
}
//Todo fixed reusable pagination
