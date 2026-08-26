export type LegalDocumentCode = "TERMS" | "PRIVACY";
export type LegalRequiredAction = "ACCEPT" | "ACKNOWLEDGE" | "NONE";
export type LegalActionType = "ACCEPTED" | "ACKNOWLEDGED";
export type LegalAcceptanceMethod =
  | "REGISTRATION"
  | "LOGIN_REACCEPTANCE"
  | "SETTINGS";

export type LegalDocumentMetadata = {
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
  publishedAt: string | null;
  effectiveAt: string | null;
};

export type LegalDocumentResponse = LegalDocumentMetadata & {
  content: string;
  status?: "PUBLISHED" | "RETIRED";
};

export type LegalAcceptanceStatusResponse = {
  idLegalDocument: number;
  code: LegalDocumentCode;
  name: string;
  requiredAction: LegalRequiredAction;
  idLegalDocumentVersion: number | null;
  currentVersion: string | null;
  title: string | null;
  contentHash: string | null;
  requiresUserAction: boolean;
  effectiveAt: string | null;
  idLegalAcceptance: number | null;
  actionType: LegalActionType | null;
  acceptanceMethod: LegalAcceptanceMethod | null;
  acceptedAt: string | null;
  actionRequired: boolean;
};

export type LegalAcceptanceResponse = {
  idLegalAcceptance: number;
  idLegalDocumentVersion: number;
  code: LegalDocumentCode;
  name: string;
  version: string;
  idBusiness: number;
  idUser: number;
  actionType: LegalActionType;
  acceptanceMethod: LegalAcceptanceMethod;
  acceptedAt: string;
  ipAddress: string | null;
  userAgent: string | null;
};

export type RecordLegalAcceptanceBody = {
  code: LegalDocumentCode;
  confirmed: true;
};
