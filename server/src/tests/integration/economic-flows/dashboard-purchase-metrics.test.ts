import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { getDashboardDataService } from "@/modules/businesses-app/dashboard/services/dashboard.service.js";
import { createOperationalBusinessFixture } from "@/tests/fixtures/business.fixture.js";
import {
  executeInsert,
  resetIntegrationTestData,
} from "@/tests/helpers/test-database.helper.js";

async function createDashboardPurchase(input: {
  idBusiness: number;
  idUser: number;
  total: number;
  status?: "COMPLETED" | "CANCELLED";
  purchaseDate?: string;
}): Promise<number> {
  return executeInsert(
    `INSERT INTO purchases
      (idBusiness, idUser, idSupplier, purchase_number, idempotency_key, purchase_date, subtotal, discount_total, total, observation, status)
     VALUES (?, ?, NULL, ?, ?, ?, ?, 0, ?, 'Compra dashboard test', ?)`,
    [
      input.idBusiness,
      input.idUser,
      `PUR-DASH-${randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`,
      `dash-purchase-${randomUUID()}`,
      input.purchaseDate ?? new Date().toISOString().slice(0, 19).replace("T", " "),
      input.total,
      input.total,
      input.status ?? "COMPLETED",
    ],
  );
}

describe("dashboard purchase metrics", function dashboardPurchaseMetricsSuite() {
  beforeEach(async function resetData() {
    await resetIntegrationTestData();
  });

  it("devuelve cero cuando no hay compras", async function testNoPurchases() {
    const tenant = await createOperationalBusinessFixture("dashboard_empty");
    const dashboard = await getDashboardDataService(
      tenant.business.idBusiness,
      new Date().getFullYear(),
    );

    expect(dashboard.metrics.todayPurchasesTotal).toBe(0);
    expect(dashboard.metrics.monthPurchasesTotal).toBe(0);
    expect(dashboard.metrics.todayPurchasesCount).toBe(0);
    expect(dashboard.metrics.monthAveragePurchase).toBe(0);
  });

  it("calcula compras efectivas de hoy y promedio mensual", async function testPurchaseMetrics() {
    const tenant = await createOperationalBusinessFixture("dashboard_purchases");

    await createDashboardPurchase({
      idBusiness: tenant.business.idBusiness,
      idUser: tenant.owner.idUser,
      total: 100,
    });
    await createDashboardPurchase({
      idBusiness: tenant.business.idBusiness,
      idUser: tenant.owner.idUser,
      total: 300,
    });
    await createDashboardPurchase({
      idBusiness: tenant.business.idBusiness,
      idUser: tenant.owner.idUser,
      total: 900,
      status: "CANCELLED",
    });

    const dashboard = await getDashboardDataService(
      tenant.business.idBusiness,
      new Date().getFullYear(),
    );

    expect(dashboard.metrics.todayPurchasesTotal).toBe(400);
    expect(dashboard.metrics.monthPurchasesTotal).toBe(400);
    expect(dashboard.metrics.todayPurchasesCount).toBe(2);
    expect(dashboard.metrics.monthAveragePurchase).toBe(200);
  });

  it("aisla compras de otros negocios", async function testTenantIsolation() {
    const tenantA = await createOperationalBusinessFixture("dashboard_a");
    const tenantB = await createOperationalBusinessFixture("dashboard_b");

    await createDashboardPurchase({
      idBusiness: tenantA.business.idBusiness,
      idUser: tenantA.owner.idUser,
      total: 150,
    });
    await createDashboardPurchase({
      idBusiness: tenantB.business.idBusiness,
      idUser: tenantB.owner.idUser,
      total: 999,
    });

    const dashboard = await getDashboardDataService(
      tenantA.business.idBusiness,
      new Date().getFullYear(),
    );

    expect(dashboard.metrics.todayPurchasesTotal).toBe(150);
    expect(dashboard.metrics.monthPurchasesTotal).toBe(150);
    expect(dashboard.metrics.todayPurchasesCount).toBe(1);
    expect(dashboard.metrics.monthAveragePurchase).toBe(150);
  });
});
