import type { RowDataPacket } from "mysql2";
import { pool } from "@/db/db.js";
import { createAppError } from "@/helpers/app-error.helper.js";
import {
  mapLegalAcceptance,
  mapLegalAcceptanceStatus,
  mapLegalDocument,
  mapLegalDocumentMetadata,
} from "../helpers/legal.mapper.js";
import type {
  LegalAcceptanceResponse,
  LegalAcceptanceStatusResponse,
  LegalDocumentCode,
  LegalDocumentMetadata,
  LegalDocumentMetadataRow,
  LegalDocumentResponse,
  LegalDocumentRow,
  LegalAcceptanceRow,
  LegalAcceptanceStatusRow,
} from "../types/index.js";

const LEGAL_DOCUMENTS_UNAVAILABLE_MESSAGE =
  "Los documentos legales necesarios para crear una cuenta no están disponibles temporalmente.";

function createLegalNotFoundError(message = "Documento legal no encontrado") {
  return createAppError({
    statusCode: 404,
    code: "LEGAL_DOCUMENT_NOT_FOUND",
    message,
  });
}

export function getLegalDocumentsUnavailableMessage(): string {
  return LEGAL_DOCUMENTS_UNAVAILABLE_MESSAGE;
}

export async function getCurrentLegalDocumentsService(): Promise<
  LegalDocumentMetadata[]
> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_get_current_legal_documents()",
  );

  const result = rows as unknown as LegalDocumentMetadataRow[][];
  return (result[0] ?? []).map(mapLegalDocumentMetadata);
}

export async function getCurrentLegalDocumentService(
  code: LegalDocumentCode,
): Promise<LegalDocumentResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_get_current_legal_document(?)",
    [code],
  );

  const result = rows as unknown as LegalDocumentRow[][];
  const document = result[0]?.[0];

  if (!document) {
    throw createLegalNotFoundError();
  }

  return mapLegalDocument(document);
}

export async function getLegalDocumentVersionService(
  code: LegalDocumentCode,
  version: string,
): Promise<LegalDocumentResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_get_legal_document_version(?, ?)",
    [code, version],
  );

  const result = rows as unknown as LegalDocumentRow[][];
  const document = result[0]?.[0];

  if (!document) {
    throw createLegalNotFoundError("Version legal no encontrada");
  }

  return mapLegalDocument(document);
}

export async function getBusinessUserLegalStatusService(
  idBusiness: number,
  idUser: number,
): Promise<LegalAcceptanceStatusResponse[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_get_business_user_legal_status(?, ?)",
    [idBusiness, idUser],
  );

  const result = rows as unknown as LegalAcceptanceStatusRow[][];
  return (result[0] ?? []).map(mapLegalAcceptanceStatus);
}

export async function recordLegalAcceptanceService(
  idBusiness: number,
  idUser: number,
  code: LegalDocumentCode,
  ipAddress?: string,
  userAgent?: string,
): Promise<LegalAcceptanceResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_record_legal_acceptance(?, ?, ?, ?, ?, ?)",
    [
      idBusiness,
      idUser,
      code,
      "SETTINGS",
      ipAddress ?? null,
      userAgent ? userAgent.slice(0, 500) : null,
    ],
  );

  const result = rows as unknown as LegalAcceptanceRow[][];
  const acceptance = result[0]?.[0];

  if (!acceptance) {
    throw new Error("No se pudo registrar la aceptacion legal");
  }

  return mapLegalAcceptance(acceptance);
}
