import { Request } from "express";

export interface PaginationResult {
  limit: number;
  offset: number;
  page: number;
}

export const getPagination = (req: Request, defaultLimit = 10): PaginationResult => {
  let page = Number(req.query.page) || 1;
  let limit = Number(req.query.limit) || defaultLimit;

  if (page < 1) page = 1;
  if (limit < 1) limit = defaultLimit;

  const offset = (page - 1) * limit;

  return { limit, offset, page };
};
