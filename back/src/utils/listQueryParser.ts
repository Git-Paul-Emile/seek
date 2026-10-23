import type { Request } from "express";

export interface ListQueryParams {
  page: number;
  limit: number;
  skip: number;
  search: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
  actif: boolean | undefined;
  categorieId: string | undefined;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function parseListQuery(req: Request, defaultSortBy = "createdAt"): ListQueryParams {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const skip = (page - 1) * limit;

  const search = (req.query.search as string)?.trim() ?? "";

  const sortBy = (req.query.sortBy as string) || defaultSortBy;
  const sortOrder: "asc" | "desc" =
    (req.query.sortOrder as string) === "asc" ? "asc" : "desc";

  let actif: boolean | undefined = undefined;
  if (req.query.actif === "true") actif = true;
  else if (req.query.actif === "false") actif = false;

  const categorieId = (req.query.categorieId as string) || undefined;

  return { page, limit, skip, search, sortBy, sortOrder, actif, categorieId };
}

export function buildPaginationMeta(total: number, params: Pick<ListQueryParams, "page" | "limit">): PaginationMeta {
  return {
    total,
    page: params.page,
    limit: params.limit,
    totalPages: Math.ceil(total / params.limit),
  };
}
