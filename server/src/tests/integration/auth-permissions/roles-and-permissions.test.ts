import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { getTestApp } from "@/tests/helpers/test-app.helper.js";
import { resetIntegrationTestData } from "@/tests/helpers/test-database.helper.js";
import { loginBusinessTestUser } from "@/tests/helpers/business-auth-test.helper.js";
import { createOperationalBusinessFixture } from "@/tests/fixtures/business.fixture.js";
import { createBusinessUserFixture } from "@/tests/fixtures/business-user.fixture.js";
import { createPlatformUserFixture } from "@/tests/fixtures/platform-user.fixture.js";
import {
  clearBusinessUserPermissionOverrides,
  countRowsBySql,
  setBusinessUserPermissionOverride,
} from "@/tests/helpers/auth-db-test.helper.js";

const app = getTestApp();

describe("Roles y permisos BUSINESS/PLATFORM", function rolesPermissionsSuite() {
  beforeEach(async function resetData() {
    await resetIntegrationTestData();
  });

  it("OWNER accede a administracion de usuarios y metodos de pago", async function ownerAdminAccess() {
    const business = await createOperationalBusinessFixture("owner_permissions");

    const usersResponse = await request(app)
      .get("/api/business-users")
      .set("Cookie", business.auth.cookies);
    const paymentMethodsResponse = await request(app)
      .get("/api/payment-methods")
      .set("Cookie", business.auth.cookies);

    expect(usersResponse.status).toBe(200);
    expect(paymentMethodsResponse.status).toBe(200);
  });

  it("ADMIN respeta permisos predeterminados reales", async function adminDefaultPermissions() {
    const business = await createOperationalBusinessFixture("admin_permissions");
    const admin = await createBusinessUserFixture({
      idBusiness: business.business.idBusiness,
      role: "ADMIN",
      usernamePrefix: "admin",
    });
    const adminAuth = await loginBusinessTestUser({
      username: admin.username,
      password: admin.plainPasswordForTest,
    });

    const productsResponse = await request(app)
      .get("/api/products")
      .set("Cookie", adminAuth.cookies);
    const usersResponse = await request(app)
      .get("/api/business-users")
      .set("Cookie", adminAuth.cookies);

    expect(productsResponse.status).toBe(200);
    expect(usersResponse.status).toBe(403);
  });

  it("SELLER puede consultar productos pero no administrar usuarios", async function sellerDefaultPermissions() {
    const business = await createOperationalBusinessFixture("seller_permissions");
    const seller = await createBusinessUserFixture({
      idBusiness: business.business.idBusiness,
      role: "SELLER",
      usernamePrefix: "seller",
    });
    const sellerAuth = await loginBusinessTestUser({
      username: seller.username,
      password: seller.plainPasswordForTest,
    });

    const productsResponse = await request(app)
      .get("/api/products")
      .set("Cookie", sellerAuth.cookies);
    const usersResponse = await request(app)
      .get("/api/business-users")
      .set("Cookie", sellerAuth.cookies);

    expect(productsResponse.status).toBe(200);
    expect(usersResponse.status).toBe(403);
  });

  it("una mutacion denegada no produce efectos en usuarios del negocio", async function deniedMutationDoesNotCreateUser() {
    const business = await createOperationalBusinessFixture("denied_mutation");
    const seller = await createBusinessUserFixture({
      idBusiness: business.business.idBusiness,
      role: "SELLER",
      usernamePrefix: "seller_denied",
    });
    const sellerAuth = await loginBusinessTestUser({
      username: seller.username,
      password: seller.plainPasswordForTest,
    });
    const beforeCount = await countRowsBySql(
      "SELECT COUNT(*) AS total FROM business_users WHERE idBusiness = ?",
      [business.business.idBusiness],
    );

    const response = await request(app)
      .post("/api/business-users")
      .set("Cookie", sellerAuth.cookies)
      .send({
        name: "Usuario denegado",
        username: "usuario_denegado",
        email: "usuario_denegado@test.local",
        password: "Usuario-123",
        role: "SELLER",
        permissions: [],
      });
    const afterCount = await countRowsBySql(
      "SELECT COUNT(*) AS total FROM business_users WHERE idBusiness = ?",
      [business.business.idBusiness],
    );

    expect(response.status).toBe(403);
    expect(afterCount).toBe(beforeCount);
  });

  it("un permiso personalizado ALLOW concede y su revocacion vuelve a bloquear", async function allowOverrideGrantsAccess() {
    const business = await createOperationalBusinessFixture("allow_override");
    const seller = await createBusinessUserFixture({
      idBusiness: business.business.idBusiness,
      role: "SELLER",
      usernamePrefix: "seller_allow",
    });
    const sellerAuth = await loginBusinessTestUser({
      username: seller.username,
      password: seller.plainPasswordForTest,
    });

    const before = await request(app)
      .get("/api/business-users")
      .set("Cookie", sellerAuth.cookies);
    await setBusinessUserPermissionOverride({
      idBusiness: business.business.idBusiness,
      idUser: seller.idUser,
      permissionCode: "users.view",
      effect: "ALLOW",
      createdByUserId: business.owner.idUser,
    });
    const afterAllow = await request(app)
      .get("/api/business-users")
      .set("Cookie", sellerAuth.cookies);
    await clearBusinessUserPermissionOverrides({
      idBusiness: business.business.idBusiness,
      idUser: seller.idUser,
    });
    const afterClear = await request(app)
      .get("/api/business-users")
      .set("Cookie", sellerAuth.cookies);

    expect(before.status).toBe(403);
    expect(afterAllow.status).toBe(200);
    expect(afterClear.status).toBe(403);
  });

  it("un permiso personalizado DENY prevalece sobre permisos del rol", async function denyOverrideWins() {
    const business = await createOperationalBusinessFixture("deny_override");
    const seller = await createBusinessUserFixture({
      idBusiness: business.business.idBusiness,
      role: "SELLER",
      usernamePrefix: "seller_deny",
    });
    const sellerAuth = await loginBusinessTestUser({
      username: seller.username,
      password: seller.plainPasswordForTest,
    });

    const before = await request(app)
      .get("/api/products")
      .set("Cookie", sellerAuth.cookies);
    await setBusinessUserPermissionOverride({
      idBusiness: business.business.idBusiness,
      idUser: seller.idUser,
      permissionCode: "products.view",
      effect: "DENY",
      createdByUserId: business.owner.idUser,
    });
    const afterDeny = await request(app)
      .get("/api/products")
      .set("Cookie", sellerAuth.cookies);

    expect(before.status).toBe(200);
    expect(afterDeny.status).toBe(403);
  });

  it("SUPPORT consulta plataforma pero no ejecuta acciones SUPER_ADMIN", async function supportRoleRestrictions() {
    const business = await createOperationalBusinessFixture("support_platform");
    const support = await createPlatformUserFixture({ role: "SUPPORT" });

    const listResponse = await request(app)
      .get("/api/platform/businesses")
      .set("Cookie", support.auth.cookies);
    const statusResponse = await request(app)
      .patch(`/api/platform/businesses/${business.business.idBusiness}/status`)
      .set("Cookie", support.auth.cookies)
      .send({ status: "SUSPENDED" });

    expect(listResponse.status).toBe(200);
    expect(statusResponse.status).toBe(403);
  });

  it("ANALYST consulta pero no realiza mutaciones Platform", async function analystCannotMutate() {
    const analyst = await createPlatformUserFixture({ role: "ANALYST" });

    const listResponse = await request(app)
      .get("/api/platform/subscription-plans")
      .set("Cookie", analyst.auth.cookies);
    const mutationResponse = await request(app)
      .post("/api/platform/subscription-plans")
      .set("Cookie", analyst.auth.cookies)
      .send({
        code: "ANALYST_MUTATION",
        name: "Plan analista",
        description: "",
        billingPeriod: "MONTHLY",
        price: 100,
        currency: "ARS",
        trialDays: 30,
        maxUsers: null,
        maxProducts: null,
        maxDeposits: null,
        isActive: true,
      });

    expect(listResponse.status).toBe(200);
    expect(mutationResponse.status).toBe(403);
  });
});
