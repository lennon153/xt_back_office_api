import { Pagination } from "./pagination.type";

export type ApiResponse<T = any> = {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any;
  pagination?: Pagination; // optional for paginated endpoints
};