import { beforeEach, describe, expect, it } from "vitest";
import {
  cancelSaleThroughApi,
  changeDeliveryStatusThroughApi,
  closeCashSessionThroughApi,
  collectSalePaymentThroughApi,
  confirmSalePaymentThroughApi,
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
  getSalePaymentEvents,
  getSalePaymentState,
  getStockQuantity,
} from "@/tests/helpers/economic-db-test.helper.js";
import { resetIntegrationTestData } from "@/tests/helpers/test-database.helper.js";
import { executeInsert } from "@/tests/helpers/test-database.helper.js";
import { createEconomicFlowScenario } from "@/tests/fixtures/economic-flow.fixture.js";
import { createBusinessUserFixture } from "@/tests/fixtures/business-user.fixture.js";
import { loginBusinessTestUser } from "@/tests/helpers/business-auth-test.helper.js";

async function createDeliveryAuth(
  idBusiness: number,
): Promise<{ idUser: number; cookies: string[] }> {
  const user = await createBusinessUserFixture({
    idBusiness,
    role: "DELIVERY",
    usernamePrefix: "delivery_cash_flow",
  });
  const auth = await loginBusinessTestUser({
    username: user.username,
    password: user.plainPasswordForTest,
  });

  return {
    idUser: user.idUser,
    cookies: auth.cookies,
  };
}

function createDeliveryPayload(assignedToUserId: number) {
  return {
    assignedToUserId,
    recipientName: "Cliente reparto",
    recipientPhone: "3815555555",
    deliveryAddress: "Calle reparto 123",
    deliveryReference: "Puerta negra",
    observation: "Entrega de prueba",
  };
}

async function createPendingDeliverySale(input: {
  cookies: string[];
  idCustomer: number | null;
  idDeposit: number;
  idCashSession: number;
  idPaymentMethod: number;
  idProduct: number;
  assignedToUserId: number;
  total: number;
}) {
  return createSaleThroughApi({
    cookies: input.cookies,
    idCustomer: input.idCustomer,
    idDeposit: input.idDeposit,
    idCashSession: input.idCashSession,
    subtotal: input.total,
    discountTotal: 0,
    total: input.total,
    observation: "Venta con pago pendiente",
    payments: [
      {
        idPaymentMethod: input.idPaymentMethod,
        amount: input.total,
        status: "PENDING",
      },
    ],
    delivery: createDeliveryPayload(input.assignedToUserId),
    items: [
      {
        idProduct: input.idProduct,
        quantity: 1,
        unitPrice: input.total,
        discount: 0,
        total: input.total,
      },
    ],
  });
}

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

  it("separa ventas originadas de pagos cash confirmados en otra caja", async function test() {
    const scenario = await createEconomicFlowScenario();
    const delivery = await createDeliveryAuth(scenario.business.business.idBusiness);
    const firstOpen = await openCashSessionThroughApi({
      cookies: scenario.business.auth.cookies,
      idCashRegister: scenario.cashRegister.idCashRegister,
      openingAmount: 0,
    });
    const firstCashSessionId = Number(firstOpen.body.data.idCashSession);
    const sale = await createPendingDeliverySale({
      cookies: scenario.business.auth.cookies,
      idCustomer: null,
      idDeposit: scenario.sourceDeposit.idDeposit,
      idCashSession: firstCashSessionId,
      idPaymentMethod: scenario.cashPaymentMethod.idPaymentMethod,
      idProduct: scenario.product.idProduct,
      assignedToUserId: delivery.idUser,
      total: 100,
    });
    const idSalePayment = Number(sale.body.data.payments[0].idSalePayment);
    const firstLive = await getCashSessionSummaryThroughApi({
      cookies: scenario.business.auth.cookies,
      idCashSession: firstCashSessionId,
    });

    expect(firstLive.status).toBe(200);
    expect(firstLive.body.data.salesCount).toBe(1);
    expect(decimalEquals(firstLive.body.data.totalSales, 100)).toBe(true);
    expect(decimalEquals(firstLive.body.data.cashSales, 0)).toBe(true);
    expect(decimalEquals(firstLive.body.data.expectedCash, 0)).toBe(true);

    const firstClose = await closeCashSessionThroughApi({
      cookies: scenario.business.auth.cookies,
      idCashSession: firstCashSessionId,
      countedCashAmount: 0,
    });
    const secondOpen = await openCashSessionThroughApi({
      cookies: scenario.business.auth.cookies,
      idCashRegister: scenario.cashRegister.idCashRegister,
      openingAmount: 0,
    });
    const secondCashSessionId = Number(secondOpen.body.data.idCashSession);
    const confirm = await confirmSalePaymentThroughApi({
      cookies: scenario.business.auth.cookies,
      idSalePayment,
      idCashSession: secondCashSessionId,
    });
    const secondLive = await getCashSessionSummaryThroughApi({
      cookies: scenario.business.auth.cookies,
      idCashSession: secondCashSessionId,
    });
    const secondClose = await closeCashSessionThroughApi({
      cookies: scenario.business.auth.cookies,
      idCashSession: secondCashSessionId,
      countedCashAmount: 100,
    });
    const secondState = await getCashSessionState(secondCashSessionId);

    expect(firstClose.status).toBe(200);
    expect(confirm.status).toBe(200);
    expect(confirm.body.data.status).toBe("CONFIRMED");
    expect(confirm.body.data.idCashSession).toBe(secondCashSessionId);
    expect(secondLive.status).toBe(200);
    expect(secondLive.body.data.salesCount).toBe(0);
    expect(decimalEquals(secondLive.body.data.totalSales, 0)).toBe(true);
    expect(decimalEquals(secondLive.body.data.cashSales, 100)).toBe(true);
    expect(decimalEquals(secondLive.body.data.expectedCash, 100)).toBe(true);
    expect(secondClose.status).toBe(200);
    expect(decimalEquals(secondState?.expected_cash_amount, 100)).toBe(true);
  });

  it("mantiene separadas metricas comerciales y pagos mixtos confirmados", async function test() {
    const scenario = await createEconomicFlowScenario();
    const open = await openCashSessionThroughApi({
      cookies: scenario.business.auth.cookies,
      idCashRegister: scenario.cashRegister.idCashRegister,
      openingAmount: 0,
    });
    const idCashSession = Number(open.body.data.idCashSession);

    await createSaleThroughApi({
      cookies: scenario.business.auth.cookies,
      idCustomer: null,
      idDeposit: scenario.sourceDeposit.idDeposit,
      idCashSession,
      subtotal: 100,
      discountTotal: 0,
      total: 100,
      observation: "Venta mixta",
      payments: [
        {
          idPaymentMethod: scenario.cashPaymentMethod.idPaymentMethod,
          amount: 40,
          status: "CONFIRMED",
        },
        {
          idPaymentMethod: scenario.transferPaymentMethod.idPaymentMethod,
          amount: 60,
          status: "CONFIRMED",
        },
      ],
      items: [
        {
          idProduct: scenario.product.idProduct,
          quantity: 1,
          unitPrice: 100,
          discount: 0,
          total: 100,
        },
      ],
    });

    const summary = await getCashSessionSummaryThroughApi({
      cookies: scenario.business.auth.cookies,
      idCashSession,
    });
    const cashSummary = summary.body.data.summaryByPaymentMethod.find(
      function findCash(row: { idPaymentMethod: number }) {
        return row.idPaymentMethod === scenario.cashPaymentMethod.idPaymentMethod;
      },
    );
    const transferSummary = summary.body.data.summaryByPaymentMethod.find(
      function findTransfer(row: { idPaymentMethod: number }) {
        return row.idPaymentMethod === scenario.transferPaymentMethod.idPaymentMethod;
      },
    );

    expect(summary.status).toBe(200);
    expect(summary.body.data.salesCount).toBe(1);
    expect(decimalEquals(summary.body.data.totalSales, 100)).toBe(true);
    expect(decimalEquals(summary.body.data.cashSales, 40)).toBe(true);
    expect(decimalEquals(summary.body.data.nonCashSales, 60)).toBe(true);
    expect(decimalEquals(summary.body.data.expectedCash, 40)).toBe(true);
    expect(cashSummary?.salesCount).toBe(1);
    expect(decimalEquals(cashSummary?.totalAmount, 40)).toBe(true);
    expect(transferSummary?.salesCount).toBe(1);
    expect(decimalEquals(transferSummary?.totalAmount, 60)).toBe(true);
  });

  it("no incrementa caja con pagos collected hasta su liquidacion", async function test() {
    const scenario = await createEconomicFlowScenario();
    const delivery = await createDeliveryAuth(scenario.business.business.idBusiness);
    const open = await openCashSessionThroughApi({
      cookies: scenario.business.auth.cookies,
      idCashRegister: scenario.cashRegister.idCashRegister,
      openingAmount: 0,
    });
    const idCashSession = Number(open.body.data.idCashSession);
    const sale = await createPendingDeliverySale({
      cookies: scenario.business.auth.cookies,
      idCustomer: null,
      idDeposit: scenario.sourceDeposit.idDeposit,
      idCashSession,
      idPaymentMethod: scenario.cashPaymentMethod.idPaymentMethod,
      idProduct: scenario.product.idProduct,
      assignedToUserId: delivery.idUser,
      total: 100,
    });
    const idSalePayment = Number(sale.body.data.payments[0].idSalePayment);
    const idSaleDelivery = Number(sale.body.data.delivery.idSaleDelivery);

    await changeDeliveryStatusThroughApi({
      cookies: scenario.business.auth.cookies,
      idSaleDelivery,
      action: "start",
    });
    const collect = await collectSalePaymentThroughApi({
      cookies: delivery.cookies,
      idSalePayment,
    });
    const summary = await getCashSessionSummaryThroughApi({
      cookies: scenario.business.auth.cookies,
      idCashSession,
    });

    expect(collect.status).toBe(200);
    expect(collect.body.data.status).toBe("COLLECTED");
    expect(decimalEquals(summary.body.data.cashSales, 0)).toBe(true);
    expect(decimalEquals(summary.body.data.expectedCash, 0)).toBe(true);
  });

  it("rechaza confirmar directo un pago collected", async function test() {
    const scenario = await createEconomicFlowScenario();
    const delivery = await createDeliveryAuth(scenario.business.business.idBusiness);
    const open = await openCashSessionThroughApi({
      cookies: scenario.business.auth.cookies,
      idCashRegister: scenario.cashRegister.idCashRegister,
      openingAmount: 0,
    });
    const idCashSession = Number(open.body.data.idCashSession);
    const sale = await createPendingDeliverySale({
      cookies: scenario.business.auth.cookies,
      idCustomer: null,
      idDeposit: scenario.sourceDeposit.idDeposit,
      idCashSession,
      idPaymentMethod: scenario.cashPaymentMethod.idPaymentMethod,
      idProduct: scenario.product.idProduct,
      assignedToUserId: delivery.idUser,
      total: 100,
    });
    const idSalePayment = Number(sale.body.data.payments[0].idSalePayment);
    const idSaleDelivery = Number(sale.body.data.delivery.idSaleDelivery);

    await changeDeliveryStatusThroughApi({
      cookies: scenario.business.auth.cookies,
      idSaleDelivery,
      action: "start",
    });
    await collectSalePaymentThroughApi({
      cookies: delivery.cookies,
      idSalePayment,
    });
    const confirm = await confirmSalePaymentThroughApi({
      cookies: scenario.business.auth.cookies,
      idSalePayment,
      idCashSession,
    });
    const payment = await getSalePaymentState(idSalePayment);
    const events = await getSalePaymentEvents(idSalePayment);

    expect(confirm.status).toBe(400);
    expect(confirm.body.message).toBe("COLLECTED_PAYMENT_REQUIRES_CASH_SETTLEMENT");
    expect(payment?.status).toBe("COLLECTED");
    expect(payment?.idCashSettlement).toBeNull();
    expect(events.some(function hasConfirm(event) {
      return event.event_type === "PAYMENT_CONFIRMED";
    })).toBe(false);
  });

  it("permite confirmar un pago pending transfer sin incrementar efectivo", async function test() {
    const scenario = await createEconomicFlowScenario();
    const delivery = await createDeliveryAuth(scenario.business.business.idBusiness);
    const open = await openCashSessionThroughApi({
      cookies: scenario.business.auth.cookies,
      idCashRegister: scenario.cashRegister.idCashRegister,
      openingAmount: 0,
    });
    const idCashSession = Number(open.body.data.idCashSession);
    const sale = await createPendingDeliverySale({
      cookies: scenario.business.auth.cookies,
      idCustomer: null,
      idDeposit: scenario.sourceDeposit.idDeposit,
      idCashSession,
      idPaymentMethod: scenario.transferPaymentMethod.idPaymentMethod,
      idProduct: scenario.product.idProduct,
      assignedToUserId: delivery.idUser,
      total: 100,
    });
    const idSalePayment = Number(sale.body.data.payments[0].idSalePayment);
    const confirm = await confirmSalePaymentThroughApi({
      cookies: scenario.business.auth.cookies,
      idSalePayment,
      idCashSession,
    });
    const summary = await getCashSessionSummaryThroughApi({
      cookies: scenario.business.auth.cookies,
      idCashSession,
    });

    expect(confirm.status).toBe(200);
    expect(confirm.body.data.status).toBe("CONFIRMED");
    expect(decimalEquals(summary.body.data.nonCashSales, 100)).toBe(true);
    expect(decimalEquals(summary.body.data.expectedCash, 0)).toBe(true);
  });

  it("permite collect de cash pending para cadete asignado", async function test() {
    const scenario = await createEconomicFlowScenario();
    const delivery = await createDeliveryAuth(scenario.business.business.idBusiness);
    const open = await openCashSessionThroughApi({
      cookies: scenario.business.auth.cookies,
      idCashRegister: scenario.cashRegister.idCashRegister,
      openingAmount: 0,
    });
    const idCashSession = Number(open.body.data.idCashSession);
    const sale = await createPendingDeliverySale({
      cookies: scenario.business.auth.cookies,
      idCustomer: null,
      idDeposit: scenario.sourceDeposit.idDeposit,
      idCashSession,
      idPaymentMethod: scenario.cashPaymentMethod.idPaymentMethod,
      idProduct: scenario.product.idProduct,
      assignedToUserId: delivery.idUser,
      total: 100,
    });
    const idSalePayment = Number(sale.body.data.payments[0].idSalePayment);
    const idSaleDelivery = Number(sale.body.data.delivery.idSaleDelivery);

    await changeDeliveryStatusThroughApi({
      cookies: scenario.business.auth.cookies,
      idSaleDelivery,
      action: "start",
    });
    const collect = await collectSalePaymentThroughApi({
      cookies: delivery.cookies,
      idSalePayment,
    });
    const payment = await getSalePaymentState(idSalePayment);

    expect(collect.status).toBe(200);
    expect(payment?.status).toBe("COLLECTED");
    expect(payment?.collected_by_user_id).toBe(delivery.idUser);
    expect(payment?.collected_at).not.toBeNull();
  });

  it("rechaza collect de transfer pending sin cambio de metodo", async function test() {
    const scenario = await createEconomicFlowScenario();
    const delivery = await createDeliveryAuth(scenario.business.business.idBusiness);
    const open = await openCashSessionThroughApi({
      cookies: scenario.business.auth.cookies,
      idCashRegister: scenario.cashRegister.idCashRegister,
      openingAmount: 0,
    });
    const idCashSession = Number(open.body.data.idCashSession);
    const sale = await createPendingDeliverySale({
      cookies: scenario.business.auth.cookies,
      idCustomer: null,
      idDeposit: scenario.sourceDeposit.idDeposit,
      idCashSession,
      idPaymentMethod: scenario.transferPaymentMethod.idPaymentMethod,
      idProduct: scenario.product.idProduct,
      assignedToUserId: delivery.idUser,
      total: 100,
    });
    const idSalePayment = Number(sale.body.data.payments[0].idSalePayment);
    const idSaleDelivery = Number(sale.body.data.delivery.idSaleDelivery);

    await changeDeliveryStatusThroughApi({
      cookies: scenario.business.auth.cookies,
      idSaleDelivery,
      action: "start",
    });
    const collect = await collectSalePaymentThroughApi({
      cookies: delivery.cookies,
      idSalePayment,
    });
    const payment = await getSalePaymentState(idSalePayment);

    expect(collect.status).toBe(400);
    expect(collect.body.message).toBe("DELIVERY_COLLECTION_REQUIRES_CASH_METHOD");
    expect(payment?.status).toBe("PENDING");
    expect(payment?.idPaymentMethod).toBe(scenario.transferPaymentMethod.idPaymentMethod);
  });

  it("permite cambiar transfer a cash durante collect y registra eventos en orden", async function test() {
    const scenario = await createEconomicFlowScenario();
    const delivery = await createDeliveryAuth(scenario.business.business.idBusiness);
    const open = await openCashSessionThroughApi({
      cookies: scenario.business.auth.cookies,
      idCashRegister: scenario.cashRegister.idCashRegister,
      openingAmount: 0,
    });
    const idCashSession = Number(open.body.data.idCashSession);
    const sale = await createPendingDeliverySale({
      cookies: scenario.business.auth.cookies,
      idCustomer: null,
      idDeposit: scenario.sourceDeposit.idDeposit,
      idCashSession,
      idPaymentMethod: scenario.transferPaymentMethod.idPaymentMethod,
      idProduct: scenario.product.idProduct,
      assignedToUserId: delivery.idUser,
      total: 100,
    });
    const idSalePayment = Number(sale.body.data.payments[0].idSalePayment);
    const idSaleDelivery = Number(sale.body.data.delivery.idSaleDelivery);

    await changeDeliveryStatusThroughApi({
      cookies: scenario.business.auth.cookies,
      idSaleDelivery,
      action: "start",
    });
    const collect = await collectSalePaymentThroughApi({
      cookies: delivery.cookies,
      idSalePayment,
      idPaymentMethod: scenario.cashPaymentMethod.idPaymentMethod,
    });
    const payment = await getSalePaymentState(idSalePayment);
    const eventTypes = (await getSalePaymentEvents(idSalePayment)).map(function mapEvent(
      event,
    ) {
      return event.event_type;
    });

    expect(collect.status).toBe(200);
    expect(payment?.status).toBe("COLLECTED");
    expect(payment?.idPaymentMethod).toBe(scenario.cashPaymentMethod.idPaymentMethod);
    expect(eventTypes).toContain("PAYMENT_METHOD_CHANGED");
    expect(eventTypes).toContain("PAYMENT_COLLECTED");
    expect(eventTypes.indexOf("PAYMENT_METHOD_CHANGED")).toBeLessThan(
      eventTypes.indexOf("PAYMENT_COLLECTED"),
    );
  });

  it("rechaza collect con metodo de pago de otro negocio", async function test() {
    const scenario = await createEconomicFlowScenario();
    const otherScenario = await createEconomicFlowScenario();
    const delivery = await createDeliveryAuth(scenario.business.business.idBusiness);
    const open = await openCashSessionThroughApi({
      cookies: scenario.business.auth.cookies,
      idCashRegister: scenario.cashRegister.idCashRegister,
      openingAmount: 0,
    });
    const idCashSession = Number(open.body.data.idCashSession);
    const sale = await createPendingDeliverySale({
      cookies: scenario.business.auth.cookies,
      idCustomer: null,
      idDeposit: scenario.sourceDeposit.idDeposit,
      idCashSession,
      idPaymentMethod: scenario.transferPaymentMethod.idPaymentMethod,
      idProduct: scenario.product.idProduct,
      assignedToUserId: delivery.idUser,
      total: 100,
    });
    const idSalePayment = Number(sale.body.data.payments[0].idSalePayment);
    const idSaleDelivery = Number(sale.body.data.delivery.idSaleDelivery);

    await changeDeliveryStatusThroughApi({
      cookies: scenario.business.auth.cookies,
      idSaleDelivery,
      action: "start",
    });
    const collect = await collectSalePaymentThroughApi({
      cookies: delivery.cookies,
      idSalePayment,
      idPaymentMethod: otherScenario.cashPaymentMethod.idPaymentMethod,
    });
    const payment = await getSalePaymentState(idSalePayment);
    const events = await getSalePaymentEvents(idSalePayment);

    expect(collect.status).toBe(400);
    expect(collect.body.message).toBe("PAYMENT_METHOD_NOT_FOUND");
    expect(payment?.status).toBe("PENDING");
    expect(payment?.idPaymentMethod).toBe(scenario.transferPaymentMethod.idPaymentMethod);
    expect(events.some(function hasChangedOrCollected(event) {
      return ["PAYMENT_METHOD_CHANGED", "PAYMENT_COLLECTED"].includes(event.event_type);
    })).toBe(false);
  });

  it("rechaza collect con metodo cash inactivo", async function test() {
    const scenario = await createEconomicFlowScenario();
    const delivery = await createDeliveryAuth(scenario.business.business.idBusiness);
    const inactiveCashMethodId = await executeInsert(
      `INSERT INTO payment_methods
        (idBusiness, code, name, affects_cash, is_default, is_active)
       VALUES (?, 'CASH', 'Efectivo inactivo test', 1, 0, 0)`,
      [scenario.business.business.idBusiness],
    );
    const open = await openCashSessionThroughApi({
      cookies: scenario.business.auth.cookies,
      idCashRegister: scenario.cashRegister.idCashRegister,
      openingAmount: 0,
    });
    const idCashSession = Number(open.body.data.idCashSession);
    const sale = await createPendingDeliverySale({
      cookies: scenario.business.auth.cookies,
      idCustomer: null,
      idDeposit: scenario.sourceDeposit.idDeposit,
      idCashSession,
      idPaymentMethod: scenario.transferPaymentMethod.idPaymentMethod,
      idProduct: scenario.product.idProduct,
      assignedToUserId: delivery.idUser,
      total: 100,
    });
    const idSalePayment = Number(sale.body.data.payments[0].idSalePayment);
    const idSaleDelivery = Number(sale.body.data.delivery.idSaleDelivery);

    await changeDeliveryStatusThroughApi({
      cookies: scenario.business.auth.cookies,
      idSaleDelivery,
      action: "start",
    });
    const collect = await collectSalePaymentThroughApi({
      cookies: delivery.cookies,
      idSalePayment,
      idPaymentMethod: inactiveCashMethodId,
    });

    expect(collect.status).toBe(400);
    expect(collect.body.message).toBe("PAYMENT_METHOD_INACTIVE");
  });
});
