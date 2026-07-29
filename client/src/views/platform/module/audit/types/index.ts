export interface PlatformAuditLog {
  idPlatformAuditLog: number;
  actor: {
    idPlatformUser: number;
    name: string;
    username: string;
    role: string;
  };
  action: string;
  entityType: string;
  entityId: string | null;
  business: {
    idBusiness: number | null;
    name: string | null;
  };
  previousData?: unknown;
  newData?: unknown;
  metadata?: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface PlatformAuditFilters {
  platformUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  idBusiness: string;
  dateFrom: string;
  dateTo: string;
}

export interface PaginatedData<T> {
  rows: T[];
  pagination: {
    totalRecords: number;
    currentPage: number;
    totalPages: number;
    limit: number;
  };
}
