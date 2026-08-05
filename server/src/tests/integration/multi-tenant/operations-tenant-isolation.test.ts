import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import type { RowDataPacket } from "mysql2";
import { getTestApp } from "@/tests/helpers/test-app.helper.js";
import {
  querySingleRow,
  resetIntegrationTestData,
} from "@/tests/helpers/test-database.helper.js";
import {
  createTwoTenantScenario,
  type TwoTenantScenario,
} from "@/tests/fixtures/business.fixture.js";
import { createDepositFixture } from "@/tests/fixtures/deposit.fixture.js";
import { createProductCategoryFixture } from "@/tests/fixtures/product-category.fixture.js";
import { createProductFixture } from "@/tests/fixtures/product.fixture.js";
import { createPaymentMethodFixture } from "@/tests/fixtures/payment-method.fixture.js";
import { createCashRegisterFixture } from "@/tests/fixtures/cash-register.fixture.js";
import { createCashSessionFixture } from "@/tests/fixtures/cash-session.fixture.js";
import {
  expectResponseDoesNotLeak,
  expectTenantBlocked,
  extractArrayFromBody,
} from "@/tests/helpers/tenant-assertions.helper.js";

interface CountRow extends RowDataPacket {
  total: number;
}

interface DefaultRow extends RowDataPacket {
  is_default: number;
}

interface CashSessionStatusRow extends RowDataPacket {
  status: "OPEN" | "CLOSED";
}

describe("multi-tenant deposits, payments and cash", function suite() {
  let scenario: TwoTenantScenario;

  beforeEach(async function setupScenario() {
    await resetIntegrationTestData();
    scenario = await createTwoTenantScenario();
  });

  it("bloquea detalle y edicion de deposito ajeno", async function test() {
    const depositA = await createDepositFixture(
      scenario.tenantA.business.idBusiness,
      "DEPOSITO_SECRETO_TENANT_A",
    );

    const detail = await request(getTestApp())
      .get(`/api/deposits/${depositA.idDeposit}`)
      .set("Cookie", scenario.tenantB.auth.cookies);
    const update = await request(getTestApp())
      .patch(`/api/deposits/${depositA.idDeposit}`)
      .set("Cookie", scenario.tenantB.auth.cookies)
      .send({ name: "Deposito alterado", description: "No debe aplicar" });

    expectTenantBlocked(detail);
    expectTenantBlocked(update);
    expectResponseDoesNotLeak(detail, depositA.name);
  });

  it("no lista depositos de otro tenant", async function test() {
    const depositA = await createDepositFixture(
      scenario.tenantA.business.idBusiness,
      "DEPOSITO_SECRETO_TENANT_A",
    );

    const response = await request(getTestApp())
      .get("/api/deposits")
      .set("Cookie", scenario.tenantB.auth.cookies);

    expect(response.status).toBe(200);
    expect(JSON.stringify(extractArrayFromBody(response.body))).not.toContain(
      depositA.name,
    );
  });

  it("bloquea ajustar stock usando deposito de otro tenant", async function test() {
    const categoryB = await createProductCategoryFixture(
      scenario.tenantB.business.idBusiness,
    );
    const productB = await createProductFixture({
      idBusiness: scenario.tenantB.business.idBusiness,
      idProductCategory: categoryB.idProductCategory,
      idDeposit: scenario.tenantB.defaultDeposit.idDeposit,
      quantity: 10,
    });

    const response = await request(getTestApp())
      .post("/api/stock-movements/adjust")
      .set("Cookie", scenario.tenantB.auth.cookies)
      .send({
        idProduct: productB.idProduct,
        idDeposit: scenario.tenantA.defaultDeposit.idDeposit,
        quantity: 3,
        type: "ADJUSTMENT_IN",
        observation: "No debe ajustar deposito ajeno",
      });

    expectTenantBlocked(response);
    const count = await querySingleRow<CountRow>(
      "SELECT COUNT(*) AS total FROM stock_movements WHERE idBusiness = ? AND observation = ?",
      [scenario.tenantB.business.idBusiness, "No debe ajustar deposito ajeno"],
    );

    expect(count?.total).toBe(0);
  });

  it("bloquea detalle y default de metodo de pago ajeno", async function test() {
    const methodA = await createPaymentMethodFixture(
      scenario.tenantA.business.idBusiness,
      "METODO_SECRETO_TENANT_A",
    );

    const detail = await request(getTestApp())
      .get(`/api/payment-methods/${methodA.idPaymentMethod}`)
      .set("Cookie", scenario.tenantB.auth.cookies);
    const setDefault = await request(getTestApp())
      .patch(`/api/payment-methods/${methodA.idPaymentMethod}/default`)
      .set("Cookie", scenario.tenantB.auth.cookies)
      .send({});

    expectTenantBlocked(detail);
    expectTenantBlocked(setDefault);

    const state = await querySingleRow<DefaultRow>(
      "SELECT is_default FROM payment_methods WHERE idPaymentMethod = ?",
      [methodA.idPaymentMethod],
    );

    expect(state?.is_default).toBe(0);
  });

  it("bloquea detalle, edicion y default de caja ajena", async function test() {
    const registerA = await createCashRegisterFixture(
      scenario.tenantA.business.idBusiness,
      "CAJA_SECRETA_TENANT_A",
    );

    const detail = await request(getTestApp())
      .get(`/api/cash-registers/${registerA.idCashRegister}`)
      .set("Cookie", scenario.tenantB.auth.cookies);
    const update = await request(getTestApp())
      .patch(`/api/cash-registers/${registerA.idCashRegister}`)
      .set("Cookie", scenario.tenantB.auth.cookies)
      .send({ name: "Caja alterada", description: null, isDefault: false });
    const setDefault = await request(getTestApp())
      .patch(`/api/cash-registers/${registerA.idCashRegister}/default`)
      .set("Cookie", scenario.tenantB.auth.cookies);

    expectTenantBlocked(detail);
    expectTenantBlocked(update);
    expectTenantBlocked(setDefault);
    expectResponseDoesNotLeak(detail, registerA.name);
  });

  it("bloquea abrir sesion sobre caja ajena", async function test() {
    const registerA = await createCashRegisterFixture(
      scenario.tenantA.business.idBusiness,
    );

    const response = await request(getTestApp())
      .post("/api/cash-sessions/open")
      .set("Cookie", scenario.tenantB.auth.cookies)
      .send({
        idCashRegister: registerA.idCashRegister,
        openingAmount: 100,
        openingObservation: "No debe abrir caja ajena",
      });

    expectTenantBlocked(response);
    const count = await querySingleRow<CountRow>(
      "SELECT COUNT(*) AS total FROM cash_sessions WHERE idBusiness = ? AND idCashRegister = ?",
      [scenario.tenantB.business.idBusiness, registerA.idCashRegister],
    );

    expect(count?.total).toBe(0);
  });

  it("bloquea movimientos y cierre sobre sesion ajena", async function test() {
    const sessionA = await createCashSessionFixture({
      idBusiness: scenario.tenantA.business.idBusiness,
      idCashRegister: scenario.tenantA.defaultCashRegister.idCashRegister,
      idUser: scenario.tenantA.owner.idUser,
    });

    const movement = await request(getTestApp())
      .post(`/api/cash-sessions/${sessionA.idCashSession}/movements`)
      .set("Cookie", scenario.tenantB.auth.cookies)
      .send({
        movementType: "INCOME",
        category: "Ingreso ajeno",
        amount: 50,
        description: "No debe crear movimiento",
      });
    const close = await request(getTestApp())
      .post(`/api/cash-sessions/${sessionA.idCashSession}/close`)
      .set("Cookie", scenario.tenantB.auth.cookies)
      .send({
        countedCashAmount: 0,
        closingObservation: "No debe cerrar sesion ajena",
      });

    expectTenantBlocked(movement);
    expectTenantBlocked(close);

    const sessionState = await querySingleRow<CashSessionStatusRow>(
      "SELECT status FROM cash_sessions WHERE idCashSession = ?",
      [sessionA.idCashSession],
    );
    const movementCount = await querySingleRow<CountRow>(
      "SELECT COUNT(*) AS total FROM cash_movements WHERE idCashSession = ?",
      [sessionA.idCashSession],
    );

    expect(sessionState?.status).toBe("OPEN");
    expect(movementCount?.total).toBe(0);
  });
});
