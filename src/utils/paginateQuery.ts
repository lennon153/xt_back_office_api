import { Pool, RowDataPacket } from "mysql2/promise";

interface PaginationResult<T extends RowDataPacket> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

interface CountResult extends RowDataPacket {
  count: number;
}

export async function paginateQuery<T extends RowDataPacket>(
  pool: Pool,
  table: string,
  limit: number,
  offset: number,
  whereClause?: string,
  whereParams?: unknown[],
  orderBy?: string
): Promise<PaginationResult<T>> {
  // Validate inputs
  if (limit <= 0 || offset < 0) {
    throw new Error("Limit must be positive and offset must be non-negative");
  }

  if (!table || typeof table !== 'string') {
    throw new Error("Table name must be a non-empty string");
  }

  // Build base query parts
  const where = whereClause ? ` WHERE ${whereClause}` : '';
  const order = orderBy ? ` ORDER BY ${orderBy}` : '';
  
  try {
    // Get paginated data
    const [rows] = await pool.query<(T & RowDataPacket)[]>(
      `SELECT * FROM ${table}${where}${order} LIMIT ? OFFSET ?`,
      [...(whereParams || []), limit, offset]
    );

    // Get total count with proper type assertion
    const [countRows] = await pool.query<CountResult[]>(
      `SELECT COUNT(*) as count FROM ${table}${where}`,
      whereParams || []
    );

    // Type-safe count extraction
    const countRow = countRows?.[0];
    if (!countRow) {
      throw new Error("Count query returned unexpected result format");
    }

    const total = Number(countRow.count);
    if (isNaN(total)) {
      throw new Error("Count value is not a valid number");
    }

    const currentPage = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(total / limit);

    return {
      data: rows,
      total,
      page: currentPage,
      totalPages,
      limit,
      hasNext: currentPage < totalPages,
      hasPrevious: currentPage > 1,
    };
  } catch (error) {
    throw new Error(`Failed to execute paginated query: ${error instanceof Error ? error.message : String(error)}`);
  }
}