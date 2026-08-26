import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { pool } from "@/db/db.js";
import { createBusinessUserFixture } from "@/tests/fixtures/business-user.fixture.js";
import { createOperationalBusinessFixture } from "@/tests/fixtures/business.fixture.js";
import {
  createCurrentLegalDocumentsFixture,
  createLegalVersionFixture,
} from "@/tests/fixtures/legal.fixture.js";
import { loginBusinessTestUser } from "@/tests/helpers/business-auth-test.helper.js";
import {
  querySingleRow,
  resetIntegrationTestData,
} from "@/tests/helpers/test-database.helper.js";
import { getTestApp } from "@/tests/helpers/test-app.helper.js";
import type { RowDataPacket } from "mysql2";

const app = getTestApp();

interface CountRow extends RowDataPacket {
  total: number;
}

function createRegisterPayload(overrides: Record<string, unknown> = {}) {
  const suffix = Math.random().toString(36).slice(2, 10);

  return {
    name: `Usuario Legal ${suffix}`,
    username: `legal_${suffix}`,
    email: `legal_${suffix}@test.local`,
    password: "Legal-123456",
    businessName: `Negocio Legal ${suffix}`,
    businessSlug: `negocio-legal-${suffix}`,
    businessType: "VENTA_PRODUCTOS",
    logoUrl: "",
    acceptedTerms: true,
    acknowledgedPrivacy: true,
    ...overrides,
  };
}

describe("Legal MVP", function legalFlowSuite() {
  beforeEach(async function resetData() {
    await resetIntegrationTestData();
  });

  it("expone documentos legales vigentes y no publica borradores", async function publicLegalDocuments() {
    const terms = await createLegalVersionFixture({
      code: "TERMS",
      version: "test-current",
    });
    await createLegalVersionFixture({
      code: "TERMS",
      version: "test-draft",
      status: "DRAFT",
    });

    const currentList = await request(app).get("/api/legal/documents/current");

    expect(currentList.status).toBe(200);
    expect(currentList.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "TERMS",
          version: "test-current",
          contentHash: terms.contentHash,
        }),
      ]),
    );
    expect(JSON.stringify(currentList.body.data)).not.toContain(
      "Contenido legal TEST ONLY",
    );

    const currentTerms = await request(app).get(
      "/api/legal/documents/TERMS/current",
    );

    expect(currentTerms.status).toBe(200);
    expect(currentTerms.body.data.content).toBe(terms.content);

    const draft = await request(app).get(
      "/api/legal/documents/TERMS/versions/test-draft",
    );

    expect(draft.status).toBe(404);
  });

  it("permite consultar versiones historicas retiradas", async function retiredLegalVersion() {
    const retired = await createLegalVersionFixture({
      code: "PRIVACY",
      version: "test-retired",
      status: "RETIRED",
    });

    const response = await request(app).get(
      "/api/legal/documents/PRIVACY/versions/test-retired",
    );

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      code: "PRIVACY",
      version: retired.version,
      status: "RETIRED",
      content: retired.content,
    });
  });

  it("bloquea el registro si faltan documentos legales vigentes", async function registerWithoutLegalDocuments() {
    const response = await request(app)
      .post("/api/register")
      .send(createRegisterPayload());

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "Los documentos legales necesarios para crear una cuenta no están disponibles temporalmente.",
    );

    const users = await querySingleRow<CountRow>(
      "SELECT COUNT(*) AS total FROM users",
    );
    const businesses = await querySingleRow<CountRow>(
      "SELECT COUNT(*) AS total FROM businesses",
    );

    expect(users?.total).toBe(0);
    expect(businesses?.total).toBe(0);
  });

  it("exige aceptacion de terminos y reconocimiento de privacidad en registro", async function registerRequiresLegalFlags() {
    await createCurrentLegalDocumentsFixture();

    const termsResponse = await request(app)
      .post("/api/register")
      .send(createRegisterPayload({ acceptedTerms: false }));

    expect(termsResponse.status).toBe(400);
    expect(termsResponse.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "acceptedTerms" }),
      ]),
    );

    const privacyResponse = await request(app)
      .post("/api/register")
      .send(createRegisterPayload({ acknowledgedPrivacy: false }));

    expect(privacyResponse.status).toBe(400);
    expect(privacyResponse.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "acknowledgedPrivacy" }),
      ]),
    );
  });

  it("registra negocio, owner y evidencias legales dentro de la misma transaccion", async function registerCreatesLegalAcceptances() {
    await createCurrentLegalDocumentsFixture();

    const response = await request(app)
      .post("/api/register")
      .set("User-Agent", "Legal integration test")
      .send(createRegisterPayload());

    expect(response.status).toBe(201);
    expect(response.body.data.user.role).toBe("OWNER");

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT d.code, la.action_type AS actionType, la.acceptance_method AS acceptanceMethod
         FROM legal_acceptances la
         INNER JOIN legal_document_versions v
           ON v.idLegalDocumentVersion = la.idLegalDocumentVersion
         INNER JOIN legal_documents d
           ON d.idLegalDocument = v.idLegalDocument
        WHERE la.idBusiness = ? AND la.idUser = ?
        ORDER BY d.code`,
      [
        response.body.data.user.idBusiness,
        response.body.data.user.idUser,
      ],
    );

    expect(rows).toEqual([
      expect.objectContaining({
        code: "PRIVACY",
        actionType: "ACKNOWLEDGED",
        acceptanceMethod: "REGISTRATION",
      }),
      expect.objectContaining({
        code: "TERMS",
        actionType: "ACCEPTED",
        acceptanceMethod: "REGISTRATION",
      }),
    ]);
  });

  it("registra aceptaciones desde configuracion de forma idempotente", async function settingsAcceptanceIsIdempotent() {
    await createCurrentLegalDocumentsFixture();
    const fixture = await createOperationalBusinessFixture("legal_acceptance");

    const firstResponse = await request(app)
      .post("/api/legal/acceptances")
      .set("Cookie", fixture.auth.cookies)
      .send({ code: "PRIVACY", confirmed: true });
    const secondResponse = await request(app)
      .post("/api/legal/acceptances")
      .set("Cookie", fixture.auth.cookies)
      .send({ code: "PRIVACY", confirmed: true });

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    expect(secondResponse.body.data.idLegalAcceptance).toBe(
      firstResponse.body.data.idLegalAcceptance,
    );

    const count = await querySingleRow<CountRow>(
      "SELECT COUNT(*) AS total FROM legal_acceptances WHERE idBusiness = ? AND idUser = ?",
      [fixture.business.idBusiness, fixture.owner.idUser],
    );

    expect(count?.total).toBe(1);
  });

  it("impide que un vendedor acepte terminos del negocio", async function sellerCannotAcceptTerms() {
    await createCurrentLegalDocumentsFixture();
    const fixture = await createOperationalBusinessFixture("legal_seller");
    const seller = await createBusinessUserFixture({
      idBusiness: fixture.business.idBusiness,
      role: "SELLER",
    });
    const auth = await loginBusinessTestUser({
      username: seller.username,
      password: seller.plainPasswordForTest,
    });

    const response = await request(app)
      .post("/api/legal/acceptances")
      .set("Cookie", auth.cookies)
      .send({ code: "TERMS", confirmed: true });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "Solo el propietario del negocio puede aceptar los términos y condiciones.",
    );
  });
});
