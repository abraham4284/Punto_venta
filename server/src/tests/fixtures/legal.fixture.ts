import { createHash } from "node:crypto";
import {
  executeInsert,
  executeMutation,
  querySingleRow,
} from "@/tests/helpers/test-database.helper.js";
import type { RowDataPacket } from "mysql2";

interface LegalDocumentIdRow extends RowDataPacket {
  idLegalDocument: number;
}

export interface LegalVersionFixture {
  idLegalDocumentVersion: number;
  code: "TERMS" | "PRIVACY";
  version: string;
  content: string;
  contentHash: string;
}

function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

async function ensureLegalDocument(input: {
  code: "TERMS" | "PRIVACY";
  name: string;
  requiredAction: "ACCEPT" | "ACKNOWLEDGE";
}): Promise<number> {
  await executeMutation(
    `INSERT INTO legal_documents (code, name, description, required_action, is_active)
     VALUES (?, ?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE
       name = VALUES(name),
       description = VALUES(description),
       required_action = VALUES(required_action),
       is_active = 1`,
    [
      input.code,
      input.name,
      `Documento ${input.code} creado para tests`,
      input.requiredAction,
    ],
  );

  const row = await querySingleRow<LegalDocumentIdRow>(
    "SELECT idLegalDocument FROM legal_documents WHERE code = ? LIMIT 1",
    [input.code],
  );

  if (!row) {
    throw new Error(`No se pudo crear el documento legal ${input.code}`);
  }

  return row.idLegalDocument;
}

export async function createLegalVersionFixture(input: {
  code: "TERMS" | "PRIVACY";
  version?: string;
  status?: "DRAFT" | "PUBLISHED" | "RETIRED";
  effectiveAt?: Date;
  publishedAt?: Date;
}): Promise<LegalVersionFixture> {
  const requiredAction = input.code === "TERMS" ? "ACCEPT" : "ACKNOWLEDGE";
  const name =
    input.code === "TERMS"
      ? "Términos y condiciones"
      : "Política de privacidad";
  const idLegalDocument = await ensureLegalDocument({
    code: input.code,
    name,
    requiredAction,
  });
  const version = input.version ?? "test-1.0";
  const content = `Contenido legal TEST ONLY para ${input.code} ${version}`;
  const contentHash = hashContent(content);
  const status = input.status ?? "PUBLISHED";
  const stablePastDate = new Date("2020-01-01T00:00:00.000Z");
  const publishedAt = input.publishedAt ?? stablePastDate;
  const effectiveAt = input.effectiveAt ?? stablePastDate;

  const idLegalDocumentVersion = await executeInsert(
    `INSERT INTO legal_document_versions
      (idLegalDocument, version, title, content, content_hash, status, requires_user_action, published_at, effective_at)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    [
      idLegalDocument,
      version,
      `${name} ${version}`,
      content,
      contentHash,
      status,
      status === "DRAFT" ? null : publishedAt,
      status === "DRAFT" ? null : effectiveAt,
    ],
  );

  return {
    idLegalDocumentVersion,
    code: input.code,
    version,
    content,
    contentHash,
  };
}

export async function createCurrentLegalDocumentsFixture(): Promise<{
  terms: LegalVersionFixture;
  privacy: LegalVersionFixture;
}> {
  const terms = await createLegalVersionFixture({
    code: "TERMS",
    version: "test-terms-1",
  });
  const privacy = await createLegalVersionFixture({
    code: "PRIVACY",
    version: "test-privacy-1",
  });

  return { terms, privacy };
}
