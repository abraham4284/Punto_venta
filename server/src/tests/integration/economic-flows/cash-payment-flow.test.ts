import { beforeEach, describe, expect, it } from "vitest";
import {
  cancelSaleThroughApi,
  closeCashSessionThroughApi,
  createCashMovementThroughApi,
  createSaleThroughApi,
  getCashSessionSummaryThroughApi,
  openCashSessionThroughApi,
} from "@/tests/helpers/economic-http-test.helper.js";
import {
  countRows,
  decimalEquals,
  getCashSessionState,
  getPaymentSummary,
  getStockQuantity,
} from "@/tests/helpers/economic-db-test.helper.js";
import { resetIntegrationTestData } from "@/tests/helpers/test-database.helper.js";
import { createEconomicFlowScenario } from "@/tests/fixtures/economic-flow.fixture.js";

describe("economic cash session and payment method flow", function suite() {
  beforeEach(async function resetData() {
    await resetIntegrationTestData();
  });

  it("abre caja real y bloquea doble apertura sobre la misma caja", async function test() {
    const scenario = await createEconomicFlowScenario();

    const first = await openCashSessionThroughApi({
      cookies: scenario.business.auth.cookies,
      idCashRegister: scenario.cashRegister.idCashRegister,
      openingAmount: 50000,
      openingObservation: "Apertura economica",
    });
    const second = await openCashSessionThroughApi({
      cookies: scenario.business.auth.cookies,
      idCashRegister: scenario.cashRegister.idCashRegister,
      openingAmount: 1,
    });

    expect(first.status).toBe(201);
    expect(second.status).toBe(409);
    const idCashSession = Number(first.body.data.idCashSession);
    const state = await getCashSessionState(idCashSession);
    const openCount = await countRows(
      "cash_sessions",
      "idBusiness = ? AND idCashRegister = ? AND status = 'OPEN'",
      [
        scenario.business.business.idBusiness,
        scenario.cashRegister.idCashRegister,
      ],
    );

    expect(state?.status).toBe("OPEN");
    expect(state?.opened_by_user_id).toBe(scenario.business.owner.idUser);
    expect(decimalEquals(state?.opening_amount, 50000)).toBe(true);
    expect(state?.closed_at).toBeNull();
    expect(openCount).toBe(1);
  });

  it("calcula cierre con venta CASH, ingreso y egreso manual", async function test() {
    const scenario = await createEconomicFlowScenario();
    const open = await openCashSessionThroughApi({
      cookies: scenario.business.auth.cookies,
      idCashRegister: scenario.cashRegister.idCashRegister,
      openingAmount: 50000,
    });
    const idCashSession = Number(open.body.data.idCashSession);

    await createSaleThroughApi({
      cookies: scenario.business.auth.cookies,
      idCustomer: null,
      idDeposit: scenario.sourceDeposit.idDeposit,
      idCashSession,
      idPaymentMethod: scenario.cashPaymentMethod.idPaymentMethod,
      subtotal: 30000,
      discountTotal: 0,
      total: 30000,
      observation: "Venta cash cierre",
      items: [
        {
          idProduct: scenario.product.idProduct,
          quantity: 1,
          unitPrice: 30000,
          discount: 0,
          total: 30000,
        },
      ],
    });
    const income = await createCashMovementThroughApi({
      cookies: scenario.business.auth.cookies,
      idCashSession,
      movementType: "INCOME",
      category: "Ingreso manual",
      amount: 10000,
    });
    const expense = await createCashMovementThroughApi({
      cookies: scenario.business.auth.cookies,
      idCashSession,
      movementType: "EXPENSE",
      category: "Egreso manual",
      amount: 5000,
    });
    const summary = await getCashSessionSummaryThroughApi({
      cookies: scenario.business.auth.cookies,
      idCashSession,
    });
    const close = await closeCashSessionThroughApi({
      cookies: scenario.business.auth.cookies,
      idCashSession,
      countedCashAmount: 83000,
      closingObservation: "Cierre economico",
    });

    expect(income.status).toBe(201);
    expect(expense.status).toBe(201);
    expect(summary.status).toBe(200);
    expect(decimalEquals(summary.body.data.expectedCash, 85000)).toBe(true);
    expect(close.status).toBe(200);

    const state = await getCashSessionState(idCashSession);
    const cashSummary = await getPaymentSummary({
      idCashSession,
      idPaymentMethod: scenario.cashPaymentMethod.idPaymentMethod,
    });

    expect(state?.status).toBe("CLOSED");
    expect(state?.closed_by_user_id).toBe(scenario.business.owner.idUser);
    expect(state?.closed_at).not.toBeNull();
    expect(decimalEquals(state?.expected_cash_amount, 85000)).toBe(true);
    expect(decimalEquals(state?.counted_cash_amount, 83000)).toBe(true);
    expect(decimalEquals(state?.difference_amount, -2000)).toBe(true);
    expect(cashSummary?.sales_count).toBe(1);
    expect(decimalEquals(cashSummary?.total_amount, 30000)).toBe(true);
  });

  it("rechaza doble cierre sin alterar valores cerrados", async function test() {
    const scenario = await createEconomicFlowScenario();
    const open = await openCashSessionThroughApi({
      cookies: scenario.business.auth.cookies,
      idCashRegister: scenario.cashRegister.idCashRegister,
      openingAmount: 100,
    });
    const idCashSession = Number(open.body.data.idCashSession);
    const firstClose = await closeCashSessionThroughApi({
      cookies: scenario.business.auth.cookies,
      idCashSession,
      countedCashAmount: 100,
    });
    const before = await getCashSessionState(idCashSession);
    const secondClose = await closeCashSessionThroughApi({
      cookies: scenario.business.auth.cookies,
      idCashSession,
      countedCashAmount: 999,
    });
    const after = await getCashSessionState(idCashSession);

    expect(firstClose.status).toBe(200);
    expect(secondClose.status).toBe(409);
    expect(decimalEquals(after?.counted_cash_amount, before?.counted_cash_amount ?? 0)).toBe(true);
    expect(after?.closed_at?.getTime()).toBe(before?.closed_at?.getTime());
  });

  it("TRANSFER no incrementa efectivo esperado pero aparece separado en snapshot", async function test() {
    const scenario = await createEconomicFlowScenario();
    const open = await openCashSessionThroughApi({
      cookies: scenario.business.auth.cookies,
      idCashRegister: scenario.cashRegister.idCashRegister,
      openingAmount: 50000,
    });
    const idCashSession = Number(open.body.data.idCashSession);

    await createSaleThroughApi({
      cookies: scenario.business.auth.cookies,
      idCustomer: null,
      idDeposit: scenario.sourceDeposit.idDeposit,
      idCashSession,
      idPaymentMethod: scenario.cashPaymentMethod.idPaymentMethod,
      subtotal: 20000,
      discountTotal: 0,
      total: 20000,
      observation: "Venta cash snapshot",
      items: [
        {
          idProduct: scenario.product.idProduct,
          quantity: 1,
          unitPrice: 20000,
          discount: 0,
          total: 20000,
        },
      ],
    });
    await createSaleThroughApi({
      cookies: scenario.business.auth.cookies,
      idCustomer: null,
      idDeposit: scenario.sourceDeposit.idDeposit,
      idCashSession,
      idPaymentMethod: scenario.transferPaymentMethod.idPaymentMethod,
      subtotal: 30000,
      discountTotal: 0,
      total: 30000,
      observation: "Venta transfer snapshot",
      items: [
        {
          idProduct: scenario.secondProduct.idProduct,
          quantity: 1,
          unitPrice: 30000,
          discount: 0,
          total: 30000,
        },
      ],
    });

    const summary = await getCashSessionSummaryThroughApi({
      cookies: scenario.business.auth.cookies,
      idCashSession,
    });
    const close = await closeCashSessionThroughApi({
      cookies: scenario.business.auth.cookies,
      idCashSession,
      countedCashAmount: 70000,
    });

    expect(summary.status).toBe(200);
    expect(decimalEquals(summary.body.data.totalSales, 50000)).toBe(true);
    expect(decimalEquals(summary.body.data.cashSales, 20000)).toBe(true);
    expect(decimalEquals(summary.body.data.nonCashSales, 30000)).toBe(true);
    expect(decimalEquals(summary.body.data.expectedCash, 70000)).toBe(true);
    expect(close.status).toBe(200);

    const cashSummary = await getPaymentSummary({
      idCashSession,
      idPaymentMethod: scenario.cashPaymentMethod.idPaymentMethod,
    });
    const transferSummary = await getPaymentSummary({
      idCashSession,
      idPaymentMethod: scenario.transferPaymentMethod.idPaymentMethod,
    });

    expect(cashSummary?.sales_count).toBe(1);
    expect(transferSummary?.sales_count).toBe(1);
    expect(decimalEquals(cashSummary?.total_amount, 20000)).toBe(true);
    expect(decimalEquals(transferSummary?.total_amount, 30000)).toBe(true);
  });

  it("venta cancelada no impacta expected cash ni snapshot de cierre", async function test() {
    const scenario = await createEconomicFlowScenario();
    const open = await openCashSessionThroughApi({
      cookies: scenario.business.auth.cookies,
      idCashRegister: scenario.cashRegister.idCashRegister,
      openingAmount: 100,
    });
    const idCashSession = Number(open.body.data.idCashSession);
    const sale = await createSaleThroughApi({
      cookies: scenario.business.auth.cookies,
      idCustomer: null,
      idDeposit: scenario.sourceDeposit.idDeposit,
      idCashSession,
      idPaymentMethod: scenario.cashPaymentMethod.idPaymentMethod,
      subtotal: 20,
      discountTotal: 0,
      total: 20,
      observation: "Venta cancelada antes de cierre",
      items: [
        {
          idProduct: scenario.product.idProduct,
          quantity: 1,
          unitPrice: 20,
          discount: 0,
          total: 20,
        },
      ],
    });
    const idSale = Number(sale.body.data.idSale);

    await cancelSaleThroughApi({
      cookies: scenario.business.auth.cookies,
      idSale,
    });
    const close = await closeCashSessionThroughApi({
      cookies: scenario.business.auth.cookies,
      idCashSession,
      countedCashAmount: 100,
    });

    expect(close.status).toBe(200);
    const state = await getCashSessionState(idCashSession);
    const cashSummary = await getPaymentSummary({
      idCashSession,
      idPaymentMethod: scenario.cashPaymentMethod.idPaymentMethod,
    });
    const stock = await getStockQuantity({
      idBusiness: scenario.business.business.idBusiness,
      idProduct: scenario.product.idProduct,
      idDeposit: scenario.sourceDeposit.idDeposit,
    });

    expect(decimalEquals(state?.expected_cash_amount, 100)).toBe(true);
    expect(cashSummary).toBeNull();
    expect(decimalEquals(stock.toString(), 10)).toBe(true);
  });

  it("rechaza movimiento manual en sesion cerrada", async function test() {
    const scenario = await createEconomicFlowScenario();
    const open = await openCashSessionThroughApi({
      cookies: scenario.business.auth.cookies,
      idCashRegister: scenario.cashRegister.idCashRegister,
      openingAmount: 0,
    });
    const idCashSession = Number(open.body.data.idCashSession);
    await closeCashSessionThroughApi({
      cookies: scenario.business.auth.cookies,
      idCashSession,
      countedCashAmount: 0,
    });

    const movement = await createCashMovementThroughApi({
      cookies: scenario.business.auth.cookies,
      idCashSession,
      movementType: "INCOME",
      category: "Movimiento cerrado",
      amount: 1,
    });

    expect(movement.status).toBe(409);
    const movementCount = await countRows(
      "cash_movements",
      "idCashSession = ? AND category = ?",
      [idCashSession, "Movimiento cerrado"],
    );

    expect(movementCount).toBe(0);
  });
});
