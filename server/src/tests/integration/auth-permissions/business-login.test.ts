import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { getTestApp } from "@/tests/helpers/test-app.helper.js";
import { resetIntegrationTestData } from "@/tests/helpers/test-database.helper.js";
import { createOperationalBusinessFixture } from "@/tests/fixtures/business.fixture.js";
import { createBusinessUserFixture } from "@/tests/fixtures/business-user.fixture.js";
import {
  decodeAccessTokenForTest,
  decodeRefreshTokenForTest,
  expectHttpOnlyCookie,
  getCookieToken,
} from "@/tests/helpers/auth-token-test.helper.js";
import {
  getLatestSessionForUser,
  getUserSessionByIdLogin,
  setBusinessActiveState,
  setBusinessUserActiveState,
  setUserActiveState,
} from "@/tests/helpers/auth-db-test.helper.js";

const app = getTestApp();

describe("Auth BUSINESS", function businessAuthSuite() {
  beforeEach(async function resetData() {
    await resetIntegrationTestData();
  });

  it("inicia sesion con un OWNER y persiste cookies, payload y sesion", async function validOwnerLogin() {
    const fixture = await createOperationalBusinessFixture("auth_business");

    const response = await request(app).post("/api/login").send({
      username: fixture.owner.username,
      password: fixture.owner.plainPasswordForTest,
    });

    expect(response.status).toBe(200);
    expect(response.body.data.accessToken).toBeUndefined();
    expect(response.body.data.user.idUser).toBe(fixture.owner.idUser);
    expect(response.body.data.user.idBusiness).toBe(fixture.business.idBusiness);
    expect(response.body.data.user.role).toBe("OWNER");
    expect(response.body.data.user.businessName).toBe(fixture.business.name);
    expect(response.body.data.user.businessSlug).toBe(fixture.business.slug);
    expect(response.body.data.user.businessType).toBeTruthy();
    expect(response.body.data.user.logoUrl ?? null).toBeNull();
    expect(response.body.data.user.permissions).toContain("dashboard.view");
    expect(response.body.data.user.mustChangePassword).toBe(false);

    const cookies = response.headers["set-cookie"];
    expect(Array.isArray(cookies)).toBe(true);
    expectHttpOnlyCookie(cookies, "access_token");
    expectHttpOnlyCookie(cookies, "refresh_token");

    const accessPayload = decodeAccessTokenForTest(
      getCookieToken(cookies, "access_token"),
    );
    expect(accessPayload).toMatchObject({
      context: "BUSINESS",
      idUser: fixture.owner.idUser,
      idBusiness: fixture.business.idBusiness,
      businessRole: "OWNER",
    });

    const refreshPayload = decodeRefreshTokenForTest(
      getCookieToken(cookies, "refresh_token"),
    );
    expect(refreshPayload.context).toBe("BUSINESS");
    if (refreshPayload.context !== "BUSINESS") {
      throw new Error("El refresh token de negocio debe conservar contexto BUSINESS");
    }
    expect(refreshPayload.idUser).toBe(fixture.owner.idUser);
    expect(refreshPayload.idBusiness).toBe(fixture.business.idBusiness);

    const session = await getUserSessionByIdLogin(refreshPayload.idLogin);
    expect(session?.auth_context).toBe("BUSINESS");
    expect(session?.idBusiness).toBe(fixture.business.idBusiness);
    expect(session?.refresh_token_hash).toBeTruthy();

    const meResponse = await request(app)
      .get("/api/me")
      .set("Cookie", [
        `access_token=${getCookieToken(cookies, "access_token")}`,
        `refresh_token=${getCookieToken(cookies, "refresh_token")}`,
      ]);

    expect(meResponse.status).toBe(200);
    expect(meResponse.body.data.user).toEqual(
      expect.objectContaining({
        idUser: fixture.owner.idUser,
        idBusiness: fixture.business.idBusiness,
        businessName: fixture.business.name,
        businessSlug: fixture.business.slug,
        businessStatus: "ACTIVE",
        role: "OWNER",
      }),
    );
    expect(meResponse.body.data.user.permissions).toContain("dashboard.view");
  });

  it("rechaza credenciales invalidas sin emitir cookies ni crear sesion nueva", async function invalidCredentials() {
    const fixture = await createOperationalBusinessFixture("auth_invalid");
    const previousSession = await getLatestSessionForUser(fixture.owner.idUser);

    const response = await request(app).post("/api/login").send({
      username: fixture.owner.username,
      password: "Password-incorrecta-123",
    });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Usuario o contraseña incorrectos");
    expect(response.headers["set-cookie"]).toBeUndefined();
    expect(response.body.message).not.toContain(fixture.owner.username);

    const latestSession = await getLatestSessionForUser(fixture.owner.idUser);
    expect(latestSession?.idLogin).toBe(previousSession?.idLogin);
  });

  it("rechaza usuario base inactivo", async function inactiveBaseUser() {
    const fixture = await createOperationalBusinessFixture("auth_inactive_user");
    await setUserActiveState(fixture.owner.idUser, false);

    const response = await request(app).post("/api/login").send({
      username: fixture.owner.username,
      password: fixture.owner.plainPasswordForTest,
    });

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.headers["set-cookie"]).toBeUndefined();
  });

  it("rechaza relacion business_user inactiva", async function inactiveBusinessUser() {
    const fixture = await createOperationalBusinessFixture("auth_inactive_bu");
    await setBusinessUserActiveState({
      idBusiness: fixture.business.idBusiness,
      idUser: fixture.owner.idUser,
      isActive: false,
    });

    const response = await request(app).post("/api/login").send({
      username: fixture.owner.username,
      password: fixture.owner.plainPasswordForTest,
    });

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.headers["set-cookie"]).toBeUndefined();
  });

  it("rechaza negocio inactivo", async function inactiveBusiness() {
    const fixture = await createOperationalBusinessFixture("auth_inactive_business");
    await setBusinessActiveState(fixture.business.idBusiness, false);

    const response = await request(app).post("/api/login").send({
      username: fixture.owner.username,
      password: fixture.owner.plainPasswordForTest,
    });

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.headers["set-cookie"]).toBeUndefined();
  });

  it("devuelve mustChangePassword para un usuario temporal", async function temporaryPasswordFlag() {
    const fixture = await createOperationalBusinessFixture("auth_temp");
    const tempUser = await createBusinessUserFixture({
      idBusiness: fixture.business.idBusiness,
      role: "SELLER",
      mustChangePassword: true,
      usernamePrefix: "temp_seller",
    });

    const response = await request(app).post("/api/login").send({
      username: tempUser.username,
      password: tempUser.plainPasswordForTest,
    });

    expect(response.status).toBe(200);
    expect(response.body.data.user.mustChangePassword).toBe(true);
  });
});
