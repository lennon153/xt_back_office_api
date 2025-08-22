import { db } from "../configs/db";
import { PaginationOptions, PaginationResult } from "../types/pagination.type";

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

//Todo fixed reusable pagination
// export async function paginate<T>(
//   tableName: string,
//   paginationOptions: PaginationOptions & {
//     search?: string;        // keyword search
//     searchFields?: string[]; // columns to search
//     filters?: Record<string, any>; // column -> value mapping
//     sortBy?: string;        // column name
//     sortOrder?: "ASC" | "DESC";
//   },
//   transform?: (data: any) => T
// ): Promise<PaginationResult<T>> {
//   const { page, limit, search, searchFields = [], filters = {}, sortBy, sortOrder = "ASC" } =
//     paginationOptions;
//   const offset = (page - 1) * limit;

//   // Build WHERE conditions
//   const conditions: string[] = [];
//   const params: any[] = [];

//   // Filters (exact match)
//   for (const key in filters) {
//     if (filters[key] !== undefined) {
//       conditions.push(`${key} = ?`);
//       params.push(filters[key]);
//     }
//   }

//   // Search (LIKE %keyword%)
//   if (search && searchFields.length > 0) {
//     const searchConditions = searchFields.map((field) => `${field} LIKE ?`).join(" OR ");
//     conditions.push(`(${searchConditions})`);
//     searchFields.forEach(() => params.push(`%${search}%`));
//   }

//   const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

//   // Sorting
//   const orderClause = sortBy ? `ORDER BY ${sortBy} ${sortOrder}` : "";

//   try {
//     // Get total count
//     const [countRows] = await db.query(
//       `SELECT COUNT(*) as total FROM ${tableName} ${whereClause}`,
//       params
//     );
//     const total = (countRows as any)[0].total;

//     // Get paginated data
//     const [rows] = await db.query(
//       `SELECT * FROM ${tableName} ${whereClause} ${orderClause} LIMIT ? OFFSET ?`,
//       [...params, limit, offset]
//     );

//     let data = rows as T[];
//     if (transform) {
//       data = (rows as any[]).map(transform);
//     }

//     const totalPages = Math.ceil(total / limit);
//     const hasNext = page < totalPages;
//     const hasPrevious = page > 1;

//     return {
//       data,
//       pagination: {
//         total,
//         totalPages,
//         currentPage: page,
//         limit,
//         hasNext,
//         hasPrevious,
//       },
//     };
//   } catch (error) {
//     console.error("Pagination error:", error);
//     throw error;
//   }
// }


//Todo in repository 
// repositories/case.repository.ts
// import { paginate } from "../utils/pagination";
// import { Case } from "../types/case.type";
// import { PaginationOptions, PaginationResult } from "../types/pagination.type";

// export async function getCasesRepository(
//   paginationOptions: PaginationOptions & {
//     search?: string;
//     filters?: Record<string, any>;
//     sortBy?: string;
//     sortOrder?: "ASC" | "DESC";
//   }
// ): Promise<PaginationResult<Case>> {
//   return paginate<Case>("cases", {
//     ...paginationOptions,
//     searchFields: ["case_description", "case_type", "case_status"], // searchable fields
//   });
// }

//Todo in service 
// export async function getCasesService(
//   paginationOptions: PaginationOptions & {
//     search?: string;
//     filters?: Record<string, any>;
//     sortBy?: string;
//     sortOrder?: "ASC" | "DESC";
//   }
// ): Promise<PaginationResult<Case>> {
//   return getCasesRepository(paginationOptions);
// }

//Todo in controller 
// export const getCasesController = async (
//   req: Request,
//   res: Response<ApiResponse<any>>,
//   next: NextFunction
// ) => {
//   try {
//     const page = parseInt(req.query.page as string) || 1;
//     const limit = parseInt(req.query.limit as string) || 10;
//     const search = req.query.search as string | undefined;
//     const status = req.query.status as string | undefined;
//     const priority = req.query.priority as string | undefined;
//     const sortBy = (req.query.sortBy as string) || "create_at";
//     const sortOrder = (req.query.sortOrder as "ASC" | "DESC") || "DESC";

//     const result = await getCasesService({
//       page,
//       limit,
//       search,
//       filters: {
//         case_status: status,
//         priority: priority,
//       },
//       sortBy,
//       sortOrder,
//     });

//     return res.json({
//       success: true,
//       message: "Cases retrieved successfully",
//       data: result.data,
//       pagination: result.pagination,
//     });
//   } catch (error) {
//     next(error);
//   }
// };