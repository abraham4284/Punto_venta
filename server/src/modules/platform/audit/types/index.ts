import type { RowDataPacket } from "mysql2";

export interface PlatformAuditLogRow extends RowDataPacket {
  idPlatformAuditLog: number;
  idPlatformUser: number;
  platformUserName: string;
  platformUsername: string;
  platformRole: string;
  action: string;
  entityType: string;
  entityId: string | null;
  idBusiness: number | null;
  businessName: string | null;
  previousData?: unknown;
  newData?: unknown;
  metadata?: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface PlatformAuditLogResponse {
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

export interface PlatformAuditListQuery {
  platformUserId?: number;
  action?: string;
  entityType?: string;
  entityId?: string;
  idBusiness?: number;
  dateFrom?: string;
  dateTo?: string;
  page: number;
  limit: number;
}

export interface CreatePlatformAuditLogInput {
  actorIdUser: number;
  action: string;
  entityType: string;
  entityId?: string | number | null;
  idBusiness?: number | null;
  previousData?: unknown;
  newData?: unknown;
  metadata?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface PlatformUserLookupRow extends RowDataPacket {
  idPlatformUser: number;
}

export interface TotalRow extends RowDataPacket {
  totalRecords: number;
}
