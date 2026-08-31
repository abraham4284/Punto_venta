import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { getTestApp } from "@/tests/helpers/test-app.helper.js";
import { resetIntegrationTestData } from "@/tests/helpers/test-database.helper.js";
import { loginBusinessTestUser } from "@/tests/helpers/business-auth-test.helper.js";
import { createOperationalBusinessFixture } from "@/tests/fixtures/business.fixture.js";
import { createBusinessUserFixture } from "@/tests/fixtures/business-user.fixture.js";
import { createPlatformUserFixture } from "@/tests/fixtures/platform-user.fixture.js";
import {
  countRowsBySql,
  getLatestSessionForUser,
  getUserSecurityById,
  passwordMatchesUserHash,
  setUserMustChangePassword,
} from "@/tests/helpers/auth-db-test.helper.js";

const app = getTestApp();

describe("Contrasena temporal y reset administrativo", function temporaryPasswordSuite() {
  beforeEach(async function resetData() {
    await resetIntegrationTestData();
  });

  it("bloquea operativamente a usuarios con must_change_password hasta cambiarla", async function temporaryUserCannotOperate() {
    const business = await createOperationalBusinessFixture("temp_block");
    await setUserMustChangePassword(business.owner.idUser, true);
    const ownerAuth = await loginBusinessTestUser({
      username: business.owner.username,
      password: business.owner.plainPasswordForTest,
    });

    const meResponse = await request(app)
      .get("/api/me")
      .set("Cookie", ownerAuth.cookies);
    const productsResponse = await request(app)
      .get("/api/products")
      .set("Cookie", ownerAuth.cookies);
    const subscriptionResponse = await request(app)
      .get("/api/business/subscription")
      .set("Cookie", ownerAuth.cookies);

    expect(meResponse.status).toBe(200);
    expect(meResponse.body.data.user.mustChangePassword).toBe(true);
    expect(productsResponse.status).toBe(403);
    expect(productsResponse.body.code).toBe("PASSWORD_CHANGE_REQUIRED");
    expect(subscriptionResponse.status).toBe(200);
  });

  it("el cambio obligatorio limpia must_change_password, cambia hash y revoca sesiones previas", async function mandatoryPasswordChangeWorks() {
    const business = await createOperationalBusinessFixture("temp_change");
    const seller = await createBusinessUserFixture({
      idBusiness: business.business.idBusiness,
      role: "SELLER",
      mustChangePassword: true,
      usernamePrefix: "temp_change_seller",
    });
    const sellerAuth = await loginBusinessTestUser({
      username: seller.username,
      password: seller.plainPasswordForTest,
    });
    const previousSession = await getLatestSessionForUser(seller.idUser);
    const previousSecurity = await getUserSecurityById(seller.idUser);

    const response = await request(app)
      .patch(`/api/auth/update-password/${seller.idUser}`)
      .set("Cookie", sellerAuth.cookies)
      .send({
        currentPassword: seller.plainPasswordForTest,
        password: "Nueva-Contrasena-Temporal-123",
      });
    const updatedSecurity = await getUserSecurityById(seller.idUser);
    const oldLoginResponse = await request(app).post("/api/login").send({
      username: seller.username,
      password: seller.plainPasswordForTest,
    });
    const newLoginResponse = await request(app).post("/api/login").send({
      username: seller.username,
      password: "Nueva-Contrasena-Temporal-123",
    });

    expect(response.status).toBe(200);
    expect(updatedSecurity?.must_change_password).toBe(0);
    expect(updatedSecurity?.password_hash).not.toBe(previousSecurity?.password_hash);
    expect(await passwordMatchesUserHash(seller.idUser, "Nueva-Contrasena-Temporal-123")).toBe(true);
    expect(previousSession).toBeTruthy();
    expect(oldLoginResponse.status).toBeGreaterThanOrEqual(400);
    expect(newLoginResponse.status).toBe(200);
  });

  it("un usuario comun no puede cambiar contrasena ajena", async function userCannotChangeOtherPassword() {
    const business = await createOperationalBusinessFixture("password_other");
    const seller = await createBusinessUserFixture({
      idBusiness: business.business.idBusiness,
      role: "SELLER",
      usernamePrefix: "seller_other",
    });
    const admin = await createBusinessUserFixture({
      idBusiness: business.business.idBusiness,
      role: "ADMIN",
      usernamePrefix: "admin_target",
    });
    const sellerAuth = await loginBusinessTestUser({
      username: seller.username,
      password: seller.plainPasswordForTest,
    });
    const targetBefore = await getUserSecurityById(admin.idUser);

    const response = await request(app)
      .patch(`/api/auth/update-password/${admin.idUser}`)
      .set("Cookie", sellerAuth.cookies)
      .send({
        currentPassword: admin.plainPasswordForTest,
        password: "Intento-Ajeno-123",
      });
    const targetAfter = await getUserSecurityById(admin.idUser);

    expect(response.status).toBe(403);
    expect(targetAfter?.password_hash).toBe(targetBefore?.password_hash);
    expect(targetAfter?.must_change_password).toBe(targetBefore?.must_change_password);
  });

  it("SUPER_ADMIN genera password temporal, revoca sesiones y audita el reset", async function superAdminResetBusinessPassword() {
    const business = await createOperationalBusinessFixture("platform_reset");
    const seller = await createBusinessUserFixture({
      idBusiness: business.business.idBusiness,
      role: "SELLER",
      usernamePrefix: "seller_reset",
    });
    await loginBusinessTestUser({
      username: seller.username,
      password: seller.plainPasswordForTest,
    });
    const oldSession = await getLatestSessionForUser(seller.idUser);
    const superAdmin = await createPlatformUserFixture({ role: "SUPER_ADMIN" });
    const auditBefore = await countRowsBySql(
      "SELECT COUNT(*) AS total FROM platform_audit_logs",
    );

    const response = await request(app)
      .post(`/api/platform/businesses/${business.business.idBusiness}/users/${seller.idUser}/reset-password`)
      .set("Cookie", superAdmin.auth.cookies)
      .send({ mode: "GENERATE" });
    const security = await getUserSecurityById(seller.idUser);
    const oldPasswordLogin = await request(app).post("/api/login").send({
      username: seller.username,
      password: seller.plainPasswordForTest,
    });
    const temporaryPassword = String(response.body.data.temporaryPassword);
    const temporaryLogin = await request(app).post("/api/login").send({
      username: seller.username,
      password: temporaryPassword,
    });
    const auditAfter = await countRowsBySql(
      "SELECT COUNT(*) AS total FROM platform_audit_logs",
    );

    expect(response.status).toBe(200);
    expect(response.body.data.user.mustChangePassword).toBe(true);
    expect(response.body.data.temporaryPassword).toBeTruthy();
    expect(response.body.data.sessionsRevoked).toBeGreaterThanOrEqual(1);
    expect(security?.must_change_password).toBe(1);
    expect(oldSession?.idLogin).toBeTruthy();
    expect(oldPasswordLogin.status).toBeGreaterThanOrEqual(400);
    expect(temporaryLogin.status).toBe(200);
    expect(auditAfter).toBe(auditBefore + 1);
  });

  it("SUPPORT y ANALYST no pueden resetear contrasenas de usuarios Business", async function supportAndAnalystCannotResetPassword() {
    const business = await createOperationalBusinessFixture("platform_reset_denied");
    const seller = await createBusinessUserFixture({
      idBusiness: business.business.idBusiness,
      role: "SELLER",
      usernamePrefix: "seller_reset_denied",
    });
    const support = await createPlatformUserFixture({ role: "SUPPORT" });
    const analyst = await createPlatformUserFixture({ role: "ANALYST" });
    const before = await getUserSecurityById(seller.idUser);

    const supportResponse = await request(app)
      .post(`/api/platform/businesses/${business.business.idBusiness}/users/${seller.idUser}/reset-password`)
      .set("Cookie", support.auth.cookies)
      .send({ mode: "GENERATE" });
    const analystResponse = await request(app)
      .post(`/api/platform/businesses/${business.business.idBusiness}/users/${seller.idUser}/reset-password`)
      .set("Cookie", analyst.auth.cookies)
      .send({ mode: "GENERATE" });
    const after = await getUserSecurityById(seller.idUser);

    expect(supportResponse.status).toBe(403);
    expect(analystResponse.status).toBe(403);
    expect(after?.password_hash).toBe(before?.password_hash);
    expect(after?.must_change_password).toBe(before?.must_change_password);
  });
});
