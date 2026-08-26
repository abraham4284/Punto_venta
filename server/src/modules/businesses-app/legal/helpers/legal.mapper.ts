import type {
  LegalAcceptanceResponse,
  LegalAcceptanceRow,
  LegalAcceptanceStatusResponse,
  LegalAcceptanceStatusRow,
  LegalDocumentMetadata,
  LegalDocumentMetadataRow,
  LegalDocumentResponse,
  LegalDocumentRow,
} from "../types/index.js";

export function mapLegalDocumentMetadata(
  row: LegalDocumentMetadataRow,
): LegalDocumentMetadata {
  return {
    idLegalDocument: row.idLegalDocument,
    code: row.code,
    name: row.name,
    description: row.description,
    requiredAction: row.requiredAction,
    idLegalDocumentVersion: row.idLegalDocumentVersion,
    version: row.version,
    title: row.title,
    contentHash: row.contentHash,
    requiresUserAction: Boolean(row.requiresUserAction),
    publishedAt: row.publishedAt,
    effectiveAt: row.effectiveAt,
  };
}

export function mapLegalDocument(row: LegalDocumentRow): LegalDocumentResponse {
  return {
    ...mapLegalDocumentMetadata(row),
    content: row.content,
    status: row.status,
  };
}

export function mapLegalAcceptanceStatus(
  row: LegalAcceptanceStatusRow,
): LegalAcceptanceStatusResponse {
  return {
    idLegalDocument: row.idLegalDocument,
    code: row.code,
    name: row.name,
    requiredAction: row.requiredAction,
    idLegalDocumentVersion: row.idLegalDocumentVersion,
    currentVersion: row.currentVersion,
    title: row.title,
    contentHash: row.contentHash,
    requiresUserAction: Boolean(row.requiresUserAction),
    effectiveAt: row.effectiveAt,
    idLegalAcceptance: row.idLegalAcceptance,
    actionType: row.actionType,
    acceptanceMethod: row.acceptanceMethod,
    acceptedAt: row.acceptedAt,
    actionRequired: Boolean(row.actionRequired),
  };
}

export function mapLegalAcceptance(
  row: LegalAcceptanceRow,
): LegalAcceptanceResponse {
  return {
    idLegalAcceptance: row.idLegalAcceptance,
    idLegalDocumentVersion: row.idLegalDocumentVersion,
    code: row.code,
    name: row.name,
    version: row.version,
    idBusiness: row.idBusiness,
    idUser: row.idUser,
    actionType: row.actionType,
    acceptanceMethod: row.acceptanceMethod,
    acceptedAt: row.acceptedAt,
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
  };
}
