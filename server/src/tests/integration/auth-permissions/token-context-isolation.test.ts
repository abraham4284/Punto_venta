import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { getTestApp } from "@/tests/helpers/test-app.helper.js";
import { resetIntegrationTestData } from "@/tests/helpers/test-database.helper.js";
import { createOperationalBusinessFixture } from "@/tests/fixtures/business.fixture.js";
import { createPlatformUserFixture } from "@/tests/fixtures/platform-user.fixture.js";
import {
  createRawJwtForTest,
  decodeRefreshTokenForTest,
  getCookieToken,
} from "@/tests/helpers/auth-token-test.helper.js";
import {
  getUserSessionByIdLogin,
  revokeSessionByIdLogin,
} from "@/tests/helpers/auth-db-test.helper.js";

const app = getTestApp();

function getAccessSecret(): string {
  const secret = process.env.ACCESS_TOKEN_SECRET;

  if (!secret) {
    throw new Error("ACCESS_TOKEN_SECRET no configurado para tests");
  }

  return secret;
}

describe("Tokens, refresh y aislamiento de contexto", function tokenSuite() {
  beforeEach(async function resetData() {
    await resetIntegrationTestData();
  });

  it("un token BUSINESS no puede acceder a rutas Platform", async function businessTokenAgainstPlatform() {
    const business = await createOperationalBusinessFixture("business_vs_platform");

    const response = await request(app)
      .get("/api/platform/businesses")
      .set("Cookie", business.auth.cookies);

    expect(response.status).toBe(403);
  });

  it("un token PLATFORM no puede acceder a rutas Business", async function platformTokenAgainstBusiness() {
    const platform = await createPlatformUserFixture({ role: "SUPER_ADMIN" });

    const response = await request(app)
      .get("/api/products")
      .set("Cookie", platform.auth.cookies);

    expect(response.status).toBe(403);
  });

  it("rechaza access token sin context", async function tokenWithoutContextFails() {
    const business = await createOperationalBusinessFixture("legacy_access");
    const token = createRawJwtForTest(
      {
        idUser: business.owner.idUser,
        idBusiness: business.business.idBusiness,
        role: "OWNER",
      },
      getAccessSecret(),
    );

    const response = await request(app)
      .get("/api/products")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(401);
  });

  it("rechaza Bearer BUSINESS en rutas Business cuando no existe cookie httpOnly", async function businessBearerWithoutCookieFails() {
    const business = await createOperationalBusinessFixture("business_bearer");
    const token = createRawJwtForTest(
      {
        context: "BUSINESS",
        idUser: business.owner.idUser,
        idBusiness: business.business.idBusiness,
        businessRole: "OWNER",
      },
      getAccessSecret(),
    );

    const response = await request(app)
      .get("/api/products")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(401);
  });

  it("rechaza access tokens manipulados con firma invalida, expirados o payload incompleto", async function manipulatedTokensFail() {
    const business = await createOperationalBusinessFixture("manipulated_tokens");
    const invalidSignatureToken = createRawJwtForTest(
      {
        context: "BUSINESS",
        idUser: business.owner.idUser,
        idBusiness: business.business.idBusiness,
        businessRole: "OWNER",
      },
      "firma_incorrecta",
    );
    const expiredToken = createRawJwtForTest(
      {
        context: "BUSINESS",
        idUser: business.owner.idUser,
        idBusiness: business.business.idBusiness,
        businessRole: "OWNER",
      },
      getAccessSecret(),
      "-1s",
    );
    const incompleteToken = createRawJwtForTest(
      {
        context: "BUSINESS",
        idUser: business.owner.idUser,
        businessRole: "OWNER",
      },
      getAccessSecret(),
    );

    const responses = await Promise.all([
      request(app).get("/api/products").set("Authorization", `Bearer ${invalidSignatureToken}`),
      request(app).get("/api/products").set("Authorization", `Bearer ${expiredToken}`),
      request(app).get("/api/products").set("Authorization", `Bearer ${incompleteToken}`),
    ]);

    responses.forEach(function assertUnauthorized(response) {
      expect(response.status).toBe(401);
    });
  });

  it("renueva refresh BUSINESS y revoca la sesion anterior", async function refreshBusinessRotatesSession() {
    const business = await createOperationalBusinessFixture("refresh_business");
    const oldRefreshPayload = decodeRefreshTokenForTest(
      getCookieToken(business.auth.cookies, "refresh_token"),
    );

    const response = await request(app)
      .post("/api/refresh")
      .set("Cookie", business.auth.cookies);

    expect(response.status).toBe(200);
    expect(response.body.data).toBeNull();

    const newCookies = response.headers["set-cookie"];
    const newRefreshPayload = decodeRefreshTokenForTest(
      getCookieToken(newCookies, "refresh_token"),
    );
    expect(newRefreshPayload.context).toBe("BUSINESS");
    if (newRefreshPayload.context !== "BUSINESS") {
      throw new Error("El refresh renovado debe ser BUSINESS");
    }
    expect(newRefreshPayload.idBusiness).toBe(business.business.idBusiness);
    expect(newRefreshPayload.idLogin).not.toBe(oldRefreshPayload.idLogin);

    const oldSession = await getUserSessionByIdLogin(oldRefreshPayload.idLogin);
    const newSession = await getUserSessionByIdLogin(newRefreshPayload.idLogin);
    expect(oldSession?.revoked_at).toBeTruthy();
    expect(newSession?.revoked_at).toBeNull();
  });

  it("renueva refresh PLATFORM y rechaza refresh cruzado", async function refreshPlatformAndCrossContext() {
    const business = await createOperationalBusinessFixture("refresh_cross_business");
    const platform = await createPlatformUserFixture({ role: "SUPER_ADMIN" });

    const platformRefresh = await request(app)
      .post("/api/platform/auth/refresh")
      .set("Cookie", platform.auth.cookies);
    const businessRefreshOnPlatform = await request(app)
      .post("/api/platform/auth/refresh")
      .set("Cookie", business.auth.cookies);
    const platformRefreshOnBusiness = await request(app)
      .post("/api/refresh")
      .set("Cookie", platform.auth.cookies);

    expect(platformRefresh.status).toBe(200);
    expect(platformRefresh.body.data.accessToken).toBeTruthy();
    expect(
      decodeRefreshTokenForTest(
        getCookieToken(platformRefresh.headers["set-cookie"], "refresh_token"),
      ).context,
    ).toBe("PLATFORM");
    expect(businessRefreshOnPlatform.status).toBeGreaterThanOrEqual(400);
    expect(platformRefreshOnBusiness.status).toBeGreaterThanOrEqual(400);
  });

  it("no renueva una sesion revocada", async function revokedSessionDoesNotRefresh() {
    const business = await createOperationalBusinessFixture("revoked_session");
    const refreshPayload = decodeRefreshTokenForTest(
      getCookieToken(business.auth.cookies, "refresh_token"),
    );
    await revokeSessionByIdLogin(refreshPayload.idLogin);

    const response = await request(app)
      .post("/api/refresh")
      .set("Cookie", business.auth.cookies);

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.headers["set-cookie"]).toEqual(
      expect.arrayContaining([
        expect.stringContaining("access_token=;"),
        expect.stringContaining("refresh_token=;"),
      ]),
    );
  });

  it("logout BUSINESS y PLATFORM revocan sesiones e invalidan refresh posterior", async function logoutRevokesSessions() {
    const business = await createOperationalBusinessFixture("logout_business");
    const platform = await createPlatformUserFixture({ role: "SUPER_ADMIN" });
    const businessPayload = decodeRefreshTokenForTest(
      getCookieToken(business.auth.cookies, "refresh_token"),
    );
    const platformPayload = decodeRefreshTokenForTest(
      getCookieToken(platform.auth.cookies, "refresh_token"),
    );

    const businessLogout = await request(app)
      .post("/api/logout")
      .set("Cookie", business.auth.cookies);
    const platformLogout = await request(app)
      .post("/api/platform/auth/logout")
      .set("Cookie", platform.auth.cookies);

    expect(businessLogout.status).toBe(200);
    expect(platformLogout.status).toBe(200);
    expect((await getUserSessionByIdLogin(businessPayload.idLogin))?.revoked_at).toBeTruthy();
    expect((await getUserSessionByIdLogin(platformPayload.idLogin))?.revoked_at).toBeTruthy();

    const businessRefresh = await request(app)
      .post("/api/refresh")
      .set("Cookie", business.auth.cookies);
    const platformRefresh = await request(app)
      .post("/api/platform/auth/refresh")
      .set("Cookie", platform.auth.cookies);

    expect(businessRefresh.status).toBeGreaterThanOrEqual(400);
    expect(platformRefresh.status).toBeGreaterThanOrEqual(400);
  });

  it("logout BUSINESS limpia cookies aunque el access token no este vigente", async function logoutWorksWithRefreshOnly() {
    const business = await createOperationalBusinessFixture("logout_refresh_only");
    const refreshPayload = decodeRefreshTokenForTest(
      getCookieToken(business.auth.cookies, "refresh_token"),
    );
    const refreshCookie = business.auth.cookies.filter(function onlyRefresh(cookie) {
      return cookie.startsWith("refresh_token=");
    });

    const response = await request(app)
      .post("/api/logout")
      .set("Cookie", refreshCookie);

    expect(response.status).toBe(200);
    expect(response.headers["set-cookie"]).toEqual(
      expect.arrayContaining([
        expect.stringContaining("access_token=;"),
        expect.stringContaining("refresh_token=;"),
      ]),
    );
    expect((await getUserSessionByIdLogin(refreshPayload.idLogin))?.revoked_at).toBeTruthy();
  });

  it("valida CSRF para mutaciones BUSINESS originadas desde navegador", async function csrfProtectsBrowserMutations() {
    const business = await createOperationalBusinessFixture("csrf_allowed");
    const trustedOriginResponse = await request(app)
      .post("/api/login")
      .set("Origin", "http://localhost:5173")
      .set("X-CSRF-Protection", "1")
      .send({
        username: business.owner.username,
        password: business.owner.plainPasswordForTest,
      });
    const badOriginResponse = await request(app)
      .post("/api/login")
      .set("Origin", "https://malicioso.test")
      .set("X-CSRF-Protection", "1")
      .send({ username: "no_importa", password: "no_importa" });
    const missingHeaderResponse = await request(app)
      .post("/api/login")
      .set("Origin", "http://localhost:5173")
      .send({ username: "no_importa", password: "no_importa" });

    expect(trustedOriginResponse.status).toBe(200);
    expect(badOriginResponse.status).toBe(403);
    expect(badOriginResponse.body.code).toBe("CSRF_VALIDATION_FAILED");
    expect(missingHeaderResponse.status).toBe(403);
    expect(missingHeaderResponse.body.code).toBe("CSRF_VALIDATION_FAILED");
  });
});
