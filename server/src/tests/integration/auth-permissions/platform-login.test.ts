import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { getTestApp } from "@/tests/helpers/test-app.helper.js";
import { resetIntegrationTestData } from "@/tests/helpers/test-database.helper.js";
import { createPlatformUserFixture } from "@/tests/fixtures/platform-user.fixture.js";
import {
  decodeAccessTokenForTest,
  decodeRefreshTokenForTest,
  expectHttpOnlyCookie,
  getCookieToken,
} from "@/tests/helpers/auth-token-test.helper.js";
import {
  getLatestSessionForUser,
  getPlatformUserRole,
  getUserSessionByIdLogin,
  setPlatformUserActiveState,
  setUserActiveState,
} from "@/tests/helpers/auth-db-test.helper.js";

const app = getTestApp();

describe("Auth PLATFORM", function platformAuthSuite() {
  beforeEach(async function resetData() {
    await resetIntegrationTestData();
  });

  it("inicia sesion SUPER_ADMIN con contexto Platform y sin exponer password_hash", async function validSuperAdminLogin() {
    const platformUser = await createPlatformUserFixture({
      role: "SUPER_ADMIN",
      login: false,
    });

    const response = await request(app).post("/api/platform/auth/login").send({
      username: platformUser.username,
      password: platformUser.plainPasswordForTest,
    });

    expect(response.status).toBe(200);
    expect(response.body.data.user.idUser).toBe(platformUser.idUser);
    expect(response.body.data.user.platformRole).toBe("SUPER_ADMIN");
    expect(JSON.stringify(response.body)).not.toContain("password_hash");

    const cookies = response.headers["set-cookie"];
    expectHttpOnlyCookie(cookies, "access_token");
    expectHttpOnlyCookie(cookies, "refresh_token");

    const accessPayload = decodeAccessTokenForTest(
      getCookieToken(cookies, "access_token"),
    );
    expect(accessPayload).toMatchObject({
      context: "PLATFORM",
      idUser: platformUser.idUser,
      platformRole: "SUPER_ADMIN",
    });

    const refreshPayload = decodeRefreshTokenForTest(
      getCookieToken(cookies, "refresh_token"),
    );
    expect(refreshPayload.context).toBe("PLATFORM");
    expect(refreshPayload.idUser).toBe(platformUser.idUser);

    const session = await getUserSessionByIdLogin(refreshPayload.idLogin);
    expect(session?.auth_context).toBe("PLATFORM");
    expect(session?.idBusiness).toBeNull();
  });

  it("permite login Platform para SUPPORT y ANALYST activos", async function supportAndAnalystLogin() {
    const support = await createPlatformUserFixture({ role: "SUPPORT", login: false });
    const analyst = await createPlatformUserFixture({ role: "ANALYST", login: false });

    const supportResponse = await request(app).post("/api/platform/auth/login").send({
      username: support.username,
      password: support.plainPasswordForTest,
    });
    const analystResponse = await request(app).post("/api/platform/auth/login").send({
      username: analyst.username,
      password: analyst.plainPasswordForTest,
    });

    expect(supportResponse.status).toBe(200);
    expect(supportResponse.body.data.user.platformRole).toBe("SUPPORT");
    expect(analystResponse.status).toBe(200);
    expect(analystResponse.body.data.user.platformRole).toBe("ANALYST");
    expect(await getPlatformUserRole(support.idUser)).toBe("SUPPORT");
    expect(await getPlatformUserRole(analyst.idUser)).toBe("ANALYST");
  });

  it("rechaza credenciales Platform invalidas sin crear nueva sesion", async function invalidPlatformCredentials() {
    const platformUser = await createPlatformUserFixture({
      role: "SUPER_ADMIN",
      login: false,
    });
    const previousSession = await getLatestSessionForUser(platformUser.idUser);

    const response = await request(app).post("/api/platform/auth/login").send({
      username: platformUser.username,
      password: "Password-incorrecta-123",
    });

    expect(response.status).toBe(401);
    expect(response.headers["set-cookie"]).toBeUndefined();
    expect(await getLatestSessionForUser(platformUser.idUser)).toBe(previousSession);
  });

  it("rechaza usuario Platform inactivo", async function inactivePlatformUser() {
    const platformUser = await createPlatformUserFixture({
      role: "SUPER_ADMIN",
      login: false,
    });
    await setPlatformUserActiveState({ idUser: platformUser.idUser, isActive: false });

    const response = await request(app).post("/api/platform/auth/login").send({
      username: platformUser.username,
      password: platformUser.plainPasswordForTest,
    });

    expect(response.status).toBe(401);
    expect(response.headers["set-cookie"]).toBeUndefined();
  });

  it("rechaza usuario base inactivo en login Platform", async function inactiveBaseUserForPlatform() {
    const platformUser = await createPlatformUserFixture({
      role: "SUPER_ADMIN",
      login: false,
    });
    await setUserActiveState(platformUser.idUser, false);

    const response = await request(app).post("/api/platform/auth/login").send({
      username: platformUser.username,
      password: platformUser.plainPasswordForTest,
    });

    expect(response.status).toBe(401);
    expect(response.headers["set-cookie"]).toBeUndefined();
  });
});
