import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { getTestApp } from "@/tests/helpers/test-app.helper.js";
import { resetIntegrationTestData } from "@/tests/helpers/test-database.helper.js";
import { createOperationalBusinessFixture } from "@/tests/fixtures/business.fixture.js";
import {
  getBusinessSubscription,
  updateBusinessSubscriptionState,
} from "@/tests/helpers/auth-db-test.helper.js";

const app = getTestApp();

describe("Estados de suscripcion y bloqueo operativo", function subscriptionSuite() {
  beforeEach(async function resetData() {
    await resetIntegrationTestData();
  });

  it("TRIAL vigente permite operar y consultar suscripcion", async function trialCanOperate() {
    const business = await createOperationalBusinessFixture("subscription_trial");

    const productsResponse = await request(app)
      .get("/api/products")
      .set("Cookie", business.auth.cookies);
    const subscriptionResponse = await request(app)
      .get("/api/business/subscription")
      .set("Cookie", business.auth.cookies);

    expect(productsResponse.status).toBe(200);
    expect(subscriptionResponse.status).toBe(200);
    expect(subscriptionResponse.body.data.subscription.status).toBe("TRIAL");
  });

  it("ACTIVE permite operar", async function activeCanOperate() {
    const business = await createOperationalBusinessFixture("subscription_active");
    await updateBusinessSubscriptionState({
      idBusiness: business.business.idBusiness,
      status: "ACTIVE",
    });

    const response = await request(app)
      .get("/api/products")
      .set("Cookie", business.auth.cookies);

    expect(response.status).toBe(200);
    expect((await getBusinessSubscription(business.business.idBusiness))?.status).toBe("ACTIVE");
  });

  it("PAST_DUE conserva la regla real actual y permite operar durante el estado", async function pastDueCurrentRule() {
    const business = await createOperationalBusinessFixture("subscription_past_due");
    await updateBusinessSubscriptionState({
      idBusiness: business.business.idBusiness,
      status: "PAST_DUE",
      gracePeriodEndsAt: "2099-01-01 00:00:00",
    });

    const response = await request(app)
      .get("/api/products")
      .set("Cookie", business.auth.cookies);
    const subscriptionResponse = await request(app)
      .get("/api/business/subscription")
      .set("Cookie", business.auth.cookies);

    expect(response.status).toBe(200);
    expect(subscriptionResponse.body.data.access.isPastDue).toBe(true);
    expect(subscriptionResponse.body.data.access.canOperate).toBe(true);
  });

  it("SUSPENDED bloquea operaciones comerciales pero permite /me, logout y consulta de suscripcion", async function suspendedBlocksOperationsWithAllowlist() {
    const business = await createOperationalBusinessFixture("subscription_suspended");
    await updateBusinessSubscriptionState({
      idBusiness: business.business.idBusiness,
      status: "SUSPENDED",
    });

    const productsResponse = await request(app)
      .get("/api/products")
      .set("Cookie", business.auth.cookies);
    const meResponse = await request(app)
      .get("/api/me")
      .set("Cookie", business.auth.cookies);
    const subscriptionResponse = await request(app)
      .get("/api/business/subscription")
      .set("Cookie", business.auth.cookies);
    const logoutResponse = await request(app)
      .post("/api/logout")
      .set("Cookie", business.auth.cookies);

    expect(productsResponse.status).toBe(402);
    expect(productsResponse.body.code).toBe("SUBSCRIPTION_REQUIRED");
    expect(meResponse.status).toBe(200);
    expect(subscriptionResponse.status).toBe(200);
    expect(subscriptionResponse.body.data.access.canOperate).toBe(false);
    expect(logoutResponse.status).toBe(200);
  });

  it("CANCELLED y EXPIRED bloquean operaciones comerciales", async function cancelledAndExpiredBlock() {
    const cancelled = await createOperationalBusinessFixture("subscription_cancelled");
    const expired = await createOperationalBusinessFixture("subscription_expired");
    await updateBusinessSubscriptionState({
      idBusiness: cancelled.business.idBusiness,
      status: "CANCELLED",
    });
    await updateBusinessSubscriptionState({
      idBusiness: expired.business.idBusiness,
      status: "EXPIRED",
    });

    const cancelledResponse = await request(app)
      .get("/api/products")
      .set("Cookie", cancelled.auth.cookies);
    const expiredResponse = await request(app)
      .get("/api/products")
      .set("Cookie", expired.auth.cookies);

    expect(cancelledResponse.status).toBe(402);
    expect(expiredResponse.status).toBe(402);
  });

  it("una suspension posterior al login se aplica en tiempo real", async function suspensionAfterLoginIsRealtime() {
    const business = await createOperationalBusinessFixture("subscription_realtime");

    const before = await request(app)
      .get("/api/products")
      .set("Cookie", business.auth.cookies);
    await updateBusinessSubscriptionState({
      idBusiness: business.business.idBusiness,
      status: "SUSPENDED",
    });
    const after = await request(app)
      .get("/api/products")
      .set("Cookie", business.auth.cookies);

    expect(before.status).toBe(200);
    expect(after.status).toBe(402);
  });
});
