import type { RowDataPacket } from "mysql2";

export type LegalDocumentCode = "TERMS" | "PRIVACY";
export type LegalRequiredAction = "ACCEPT" | "ACKNOWLEDGE" | "NONE";
export type LegalActionType = "ACCEPTED" | "ACKNOWLEDGED";
export type LegalAcceptanceMethod =
  | "REGISTRATION"
  | "LOGIN_REACCEPTANCE"
  | "SETTINGS";

export interface LegalDocumentMetadata {
  idLegalDocument: number;
  code: LegalDocumentCode;
  name: string;
  description: string | null;
  requiredAction: LegalRequiredAction;
  idLegalDocumentVersion: number;
  version: string;
  title: string;
  contentHash: string;
  requiresUserAction: boolean;
  publishedAt: Date | string | null;
  effectiveAt: Date | string | null;
}

export interface LegalDocumentResponse extends LegalDocumentMetadata {
  content: string;
  status?: "PUBLISHED" | "RETIRED";
}

export interface LegalAcceptanceStatusResponse {
  idLegalDocument: number;
  code: LegalDocumentCode;
  name: string;
  requiredAction: LegalRequiredAction;
  idLegalDocumentVersion: number | null;
  currentVersion: string | null;
  title: string | null;
  contentHash: string | null;
  requiresUserAction: boolean;
  effectiveAt: Date | string | null;
  idLegalAcceptance: number | null;
  actionType: LegalActionType | null;
  acceptanceMethod: LegalAcceptanceMethod | null;
  acceptedAt: Date | string | null;
  actionRequired: boolean;
}

export interface LegalAcceptanceResponse {
  idLegalAcceptance: number;
  idLegalDocumentVersion: number;
  code: LegalDocumentCode;
  name: string;
  version: string;
  idBusiness: number;
  idUser: number;
  actionType: LegalActionType;
  acceptanceMethod: LegalAcceptanceMethod;
  acceptedAt: Date | string;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface RecordLegalAcceptanceBody {
  code: LegalDocumentCode;
  confirmed: true;
}

export interface LegalDocumentMetadataRow extends RowDataPacket {
  idLegalDocument: number;
  code: LegalDocumentCode;
  name: string;
  description: string | null;
  requiredAction: LegalRequiredAction;
  idLegalDocumentVersion: number;
  version: string;
  title: string;
  contentHash: string;
  requiresUserAction: number;
  publishedAt: Date | string | null;
  effectiveAt: Date | string | null;
}

export interface LegalDocumentRow extends LegalDocumentMetadataRow {
  content: string;
  status?: "PUBLISHED" | "RETIRED";
}

export interface LegalAcceptanceStatusRow extends RowDataPacket {
  idLegalDocument: number;
  code: LegalDocumentCode;
  name: string;
  requiredAction: LegalRequiredAction;
  idLegalDocumentVersion: number | null;
  currentVersion: string | null;
  title: string | null;
  contentHash: string | null;
  requiresUserAction: number | null;
  effectiveAt: Date | string | null;
  idLegalAcceptance: number | null;
  actionType: LegalActionType | null;
  acceptanceMethod: LegalAcceptanceMethod | null;
  acceptedAt: Date | string | null;
  actionRequired: number;
}

export interface LegalAcceptanceRow extends RowDataPacket {
  idLegalAcceptance: number;
  idLegalDocumentVersion: number;
  code: LegalDocumentCode;
  name: string;
  version: string;
  idBusiness: number;
  idUser: number;
  actionType: LegalActionType;
  acceptanceMethod: LegalAcceptanceMethod;
  acceptedAt: Date | string;
  ipAddress: string | null;
  userAgent: string | null;
}
