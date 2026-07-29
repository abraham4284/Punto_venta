export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  rows: T[];
  pagination: {
    totalRecords: number;
    currentPage: number;
    totalPages: number;
    limit: number;
  };
}

export function getPaginationParams(pageValue: unknown, limitValue: unknown): PaginationParams {
  const page = Math.max(Number(pageValue) || 1, 1);
  const rawLimit = Number(limitValue) || 15;
  const limit = Math.min(Math.max(rawLimit, 1), 100);
  const offset = (page - 1) * limit;

  return {
    page,
    limit,
    offset,
  };
}

export function buildPaginatedResponse<T>(
  rows: T[],
  totalRecords: number,
  pagination: PaginationParams,
): PaginatedResponse<T> {
  return {
    rows,
    pagination: {
      totalRecords,
      currentPage: pagination.page,
      totalPages: Math.ceil(totalRecords / pagination.limit),
      limit: pagination.limit,
    },
  };
}
