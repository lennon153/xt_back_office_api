import { db } from "../configs/db";
import { PaginationOptions, PaginationResult } from "../types/pagination";

export async function paginate<T>(
    tableName: string,
    paginationOptions: PaginationOptions,
    queryConditions: string = '',
    params: any[] = [],
    transform?: (data: any) => T
): Promise<PaginationResult<T>> {
    const { page, limit } = paginationOptions;
    const offset = (page - 1) * limit;

    try {
        // Get total count
        const [countRows] = await db.query(
            `SELECT COUNT(*) as total FROM ${tableName} ${queryConditions}`,
            params
        );
        const total = (countRows as any)[0].total;

        // Get paginated data
        const [rows] = await db.query(
            `SELECT * FROM ${tableName} ${queryConditions} LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        // Apply transformation if provided
        let data = rows as T[];
        if (transform) {
            data = (rows as any[]).map(transform);
        }

        // Calculate pagination details
        const totalPages = Math.ceil(total / limit);
        const hasNext = page < totalPages;
        const hasPrevious = page > 1;

        return {
            data,
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
        console.error('Pagination error:', error);
        throw error;
    }
}