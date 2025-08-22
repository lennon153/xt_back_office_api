export interface Pagination {
  total: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Base pagination options
export interface PaginationOptions {
  page?: number; // optional so we can default to 1
  limit?: number; // optional, default 10
}

// Extended options for reusable paginate utility
export interface PaginateOptions extends PaginationOptions {
  search?: string | undefined;         // optional string
  searchFields?: string[] | undefined; // optional array
  filters?: Record<string, any> | undefined;
  sortBy?: string | undefined;
  sortOrder?: "ASC" | "DESC" | undefined;
}

// Paginated result
export interface PaginationResult<T> {
  data: T[];
  pagination: Pagination;
}
