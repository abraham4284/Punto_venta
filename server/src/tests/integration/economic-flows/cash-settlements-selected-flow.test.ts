import { beforeEach, describe, expect, it } from "vitest";
import {
  changeDeliveryStatusThroughApi,
  closeCashSessionThroughApi,
  collectSalePaymentThroughApi,
  createCashSettlementThroughApi,
  createSaleThroughApi,
  getCashSessionSummaryThroughApi,
  getPendingCashSettlementsThroughApi,
  openCashSessionThroughApi,
} from "@/tests/helpers/economic-http-test.helper.js";
import type { SalePaymentRequest } from "@/tests/helpers/economic-http-test.helper.js";
import {
  countRows,
  decimalEquals,
  getSalePaymentEvents,
  getSalePaymentState,
} from "@/tests/helpers/economic-db-test.helper.js";
import {
  executeMutation,
  resetIntegrationTestData,
} from "@/tests/helpers/test-database.helper.js";
import { createBusinessUserFixture } from "@/tests/fixtures/business-user.fixture.js";
import { createEconomicFlowScenario } from "@/tests/fixtures/economic-flow.fixture.js";
import { loginBusinessTestUser } from "@/tests/helpers/business-auth-test.helper.js";

interface SettlementResponseBody {
  data?: {
    idCashSettlement: number;
    totalAmount: number;
    payments: Array<{
      idSalePayment: number;
      amount: number;
      status: string;
    }>;
  };
}

interface PendingSettlementResponseBody {
  data?: {
    collectors: Array<{
      collectorUserId: number;
      paymentsCount: number;
      totalAmount: number;
      payments: Array<{
        idSalePayment: number;
        amount: number;
      }>;
    }>;
  };
}

interface DeliveryAuth {
  idUser: number;
  cookies: string[];
}

function createDeliveryPayload(assignedToUserId: number) {
  return {
    assignedToUserId,
    recipientName: "Cliente rendicion",
    recipientPhone: "3815555555",
    deliveryAddress: "Calle cash settlement 123",
    deliveryReference: "Mostrador",
    observation: "Entrega para rendicion",
  };
}

async function createDeliveryAuth(
  idBusiness: number,
  usernamePrefix: string,
): Promise<DeliveryAuth> {
  const deliveryUser = await createBusinessUserFixture({
    idBusiness,
    role: "DELIVERY",
    usernamePrefix,
  });
  const auth = await loginBusinessTestUser({
    username: deliveryUser.username,
    password: deliveryUser.plainPasswordForTest,
  });

  return {
    idUser: deliveryUser.idUser,
    cookies: auth.cookies,
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
  payments?: SalePaymentRequest[];
}) {
  return createSaleThroughApi({
    cookies: input.cookies,
    idCustomer: input.idCustomer,
    idDeposit: input.idDeposit,
    idCashSession: input.idCashSession,
    subtotal: input.total,
    discountTotal: 0,
    total: input.total,
    observation: "Venta con pago para rendicion",
    payments:
      input.payments ??
      [
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

async function createCollectedPayment(input: {
  cookies: string[];
  collectorCookies: string[];
  collectorUserId: number;
  idCashSession: number;
  idDeposit: number;
  idPaymentMethod: number;
  idProduct: number;
  total: number;
}): Promise<number> {
  const sale = await createPendingDeliverySale({
    cookies: input.cookies,
    idCustomer: null,
    idDeposit: input.idDeposit,
    idCashSession: input.idCashSession,
    idPaymentMethod: input.idPaymentMethod,
    idProduct: input.idProduct,
    assignedToUserId: input.collectorUserId,
    total: input.total,
  });
  const idSalePayment = Number(sale.body.data.payments[0].idSalePayment);
  const idSaleDelivery = Number(sale.body.data.delivery.idSaleDelivery);

  await changeDeliveryStatusThroughApi({
    cookies: input.cookies,
    idSaleDelivery,
    action: "start",
  });
  await collectSalePaymentThroughApi({
    cookies: input.collectorCookies,
    idSalePayment,
  });

  return idSalePayment;
}

async function prepareCollectedPayments(input: {
  amounts: number[];
}): Promise<{
  scenario: Awaited<ReturnType<typeof createEconomicFlowScenario>>;
  delivery: DeliveryAuth;
  idCashSession: number;
  salePaymentIds: number[];
}> {
  const scenario = await createEconomicFlowScenario();
  const delivery = await createDeliveryAuth(
    scenario.business.business.idBusiness,
    "settlement_delivery",
  );
  const open = await openCashSessionThroughApi({
    cookies: scenario.business.auth.cookies,
    idCashRegister: scenario.cashRegister.idCashRegister,
    openingAmount: 0,
  });
  const idCashSession = Number(open.body.data.idCashSession);
  const salePaymentIds: number[] = [];

  for (const amount of input.amounts) {
    salePaymentIds.push(
      await createCollectedPayment({
        cookies: scenario.business.auth.cookies,
        collectorCookies: delivery.cookies,
        collectorUserId: delivery.idUser,
        idCashSession,
        idDeposit: scenario.sourceDeposit.idDeposit,
        idPaymentMethod: scenario.cashPaymentMethod.idPaymentMethod,
        idProduct: scenario.product.idProduct,
        total: amount,
      }),
    );
  }

  return {
    scenario,
    delivery,
    idCashSession,
    salePaymentIds,
  };
}

function getSettlementData(responseBody: unknown): SettlementResponseBody["data"] {
  return (responseBody as SettlementResponseBody).data;
}

function getPendingCollectors(
  responseBody: unknown,
): NonNullable<PendingSettlementResponseBody["data"]>["collectors"] {
  return (responseBody as PendingSettlementResponseBody).data?.collectors ?? [];
}

describe("economic selected cash settlements flow", function suite() {
  beforeEach(async function resetData() {
    await resetIntegrationTestData();
  });

  it("liquida solamente los pagos seleccionados y deja los no seleccionados collected", async function test() {
    const setup = await prepareCollectedPayments({ amounts: [20, 15, 10] });
    const pendingBefore = await getPendingCashSettlementsThroughApi({
      cookies: setup.scenario.business.auth.cookies,
      collectorUserId: setup.delivery.idUser,
    });

    const response = await createCashSettlementThroughApi({
      cookies: setup.scenario.business.auth.cookies,
      collectorUserId: setup.delivery.idUser,
      idCashSession: setup.idCashSession,
      salePaymentIds: [setup.salePaymentIds[0], setup.salePaymentIds[1]],
      observation: "Rendicion parcial",
    });
    const data = getSettlementData(response.body);
    const firstPayment = await getSalePaymentState(setup.salePaymentIds[0]);
    const secondPayment = await getSalePaymentState(setup.salePaymentIds[1]);
    const thirdPayment = await getSalePaymentState(setup.salePaymentIds[2]);
    const firstEvents = await getSalePaymentEvents(setup.salePaymentIds[0]);
    const secondEvents = await getSalePaymentEvents(setup.salePaymentIds[1]);
    const thirdEvents = await getSalePaymentEvents(setup.salePaymentIds[2]);
    const pendingAfter = await getPendingCashSettlementsThroughApi({
      cookies: setup.scenario.business.auth.cookies,
      collectorUserId: setup.delivery.idUser,
    });
    const summary = await getCashSessionSummaryThroughApi({
      cookies: setup.scenario.business.auth.cookies,
      idCashSession: setup.idCashSession,
    });

    expect(getPendingCollectors(pendingBefore.body)[0]?.paymentsCount).toBe(3);
    expect(response.status).toBe(201);
    expect(decimalEquals(data?.totalAmount, 35)).toBe(true);
    expect(data?.payments.map(function mapPayment(payment) {
      return payment.idSalePayment;
    })).toEqual([setup.salePaymentIds[0], setup.salePaymentIds[1]]);
    expect(firstPayment?.status).toBe("CONFIRMED");
    expect(secondPayment?.status).toBe("CONFIRMED");
    expect(thirdPayment?.status).toBe("COLLECTED");
    expect(firstPayment?.idCashSettlement).toBe(data?.idCashSettlement);
    expect(secondPayment?.idCashSettlement).toBe(data?.idCashSettlement);
    expect(thirdPayment?.idCashSettlement).toBeNull();
    expect(firstEvents.map(function mapEvent(event) {
      return event.event_type;
    })).toContain("PAYMENT_SETTLED");
    expect(secondEvents.map(function mapEvent(event) {
      return event.event_type;
    })).toContain("PAYMENT_SETTLED");
    expect(thirdEvents.map(function mapEvent(event) {
      return event.event_type;
    })).not.toContain("PAYMENT_SETTLED");
    expect(getPendingCollectors(pendingAfter.body)[0]?.payments.map(function mapPayment(payment) {
      return payment.idSalePayment;
    })).toEqual([setup.salePaymentIds[2]]);
    expect(decimalEquals(summary.body.data.expectedCash, 35)).toBe(true);
  });

  it("rechaza array vacio y pagos duplicados sin crear liquidacion", async function test() {
    const setup = await prepareCollectedPayments({ amounts: [20] });
    const emptyResponse = await createCashSettlementThroughApi({
      cookies: setup.scenario.business.auth.cookies,
      collectorUserId: setup.delivery.idUser,
      idCashSession: setup.idCashSession,
      salePaymentIds: [],
    });
    const duplicateResponse = await createCashSettlementThroughApi({
      cookies: setup.scenario.business.auth.cookies,
      collectorUserId: setup.delivery.idUser,
      idCashSession: setup.idCashSession,
      salePaymentIds: [setup.salePaymentIds[0], setup.salePaymentIds[0]],
    });
    const payment = await getSalePaymentState(setup.salePaymentIds[0]);
    const settlementCount = await countRows("cash_settlements", "idBusiness = ?", [
      setup.scenario.business.business.idBusiness,
    ]);

    expect(emptyResponse.status).toBe(400);
    expect(duplicateResponse.status).toBe(400);
    expect(payment?.status).toBe("COLLECTED");
    expect(settlementCount).toBe(0);
  });

  it("rechaza pagos de collectors mezclados y pagos cross tenant sin liquidar parcialmente", async function test() {
    const setup = await prepareCollectedPayments({ amounts: [20, 15] });
    const otherCollector = await createBusinessUserFixture({
      idBusiness: setup.scenario.business.business.idBusiness,
      role: "DELIVERY",
      usernamePrefix: "settlement_other_collector",
    });

    await executeMutation(
      "UPDATE sale_payments SET collected_by_user_id = ? WHERE idBusiness = ? AND idSalePayment = ?",
      [
        otherCollector.idUser,
        setup.scenario.business.business.idBusiness,
        setup.salePaymentIds[1],
      ],
    );

    const mixedResponse = await createCashSettlementThroughApi({
      cookies: setup.scenario.business.auth.cookies,
      collectorUserId: setup.delivery.idUser,
      idCashSession: setup.idCashSession,
      salePaymentIds: setup.salePaymentIds,
    });
    const tenantB = await prepareCollectedPayments({ amounts: [99] });
    const crossTenantResponse = await createCashSettlementThroughApi({
      cookies: setup.scenario.business.auth.cookies,
      collectorUserId: setup.delivery.idUser,
      idCashSession: setup.idCashSession,
      salePaymentIds: [setup.salePaymentIds[0], tenantB.salePaymentIds[0]],
    });

    expect(mixedResponse.status).toBe(400);
    expect(mixedResponse.body.message).toBe("CASH_SETTLEMENT_MIXED_COLLECTOR");
    expect(crossTenantResponse.status).toBe(400);
    expect(crossTenantResponse.body.message).toBe("CASH_SETTLEMENT_PAYMENT_NOT_ELIGIBLE");
    expect((await getSalePaymentState(setup.salePaymentIds[0]))?.status).toBe("COLLECTED");
    expect((await getSalePaymentState(setup.salePaymentIds[1]))?.status).toBe("COLLECTED");
    expect((await getSalePaymentState(tenantB.salePaymentIds[0]))?.status).toBe("COLLECTED");
  });

  it("rechaza pagos pending, pagos ya rendidos y caja cerrada", async function test() {
    const setup = await prepareCollectedPayments({ amounts: [20, 15] });
    const pendingSale = await createPendingDeliverySale({
      cookies: setup.scenario.business.auth.cookies,
      idCustomer: null,
      idDeposit: setup.scenario.sourceDeposit.idDeposit,
      idCashSession: setup.idCashSession,
      idPaymentMethod: setup.scenario.cashPaymentMethod.idPaymentMethod,
      idProduct: setup.scenario.product.idProduct,
      assignedToUserId: setup.delivery.idUser,
      total: 10,
    });
    const pendingPaymentId = Number(pendingSale.body.data.payments[0].idSalePayment);
    const invalidStatusResponse = await createCashSettlementThroughApi({
      cookies: setup.scenario.business.auth.cookies,
      collectorUserId: setup.delivery.idUser,
      idCashSession: setup.idCashSession,
      salePaymentIds: [setup.salePaymentIds[0], pendingPaymentId],
    });
    const settledResponse = await createCashSettlementThroughApi({
      cookies: setup.scenario.business.auth.cookies,
      collectorUserId: setup.delivery.idUser,
      idCashSession: setup.idCashSession,
      salePaymentIds: [setup.salePaymentIds[0]],
    });
    const alreadySettledResponse = await createCashSettlementThroughApi({
      cookies: setup.scenario.business.auth.cookies,
      collectorUserId: setup.delivery.idUser,
      idCashSession: setup.idCashSession,
      salePaymentIds: [setup.salePaymentIds[0]],
    });

    await closeCashSessionThroughApi({
      cookies: setup.scenario.business.auth.cookies,
      idCashSession: setup.idCashSession,
      countedCashAmount: 20,
    });
    const closedSessionResponse = await createCashSettlementThroughApi({
      cookies: setup.scenario.business.auth.cookies,
      collectorUserId: setup.delivery.idUser,
      idCashSession: setup.idCashSession,
      salePaymentIds: [setup.salePaymentIds[1]],
    });

    expect(invalidStatusResponse.status).toBe(400);
    expect(invalidStatusResponse.body.message).toBe(
      "CASH_SETTLEMENT_PAYMENT_NOT_ELIGIBLE",
    );
    expect(settledResponse.status).toBe(201);
    expect(alreadySettledResponse.status).toBe(400);
    expect(alreadySettledResponse.body.message).toBe(
      "CASH_SETTLEMENT_PAYMENT_ALREADY_SETTLED",
    );
    expect(closedSessionResponse.status).toBe(400);
    expect(closedSessionResponse.body.message).toBe("CASH_SESSION_CLOSED");
    expect((await getSalePaymentState(setup.salePaymentIds[1]))?.status).toBe(
      "COLLECTED",
    );
  });

  it("filtra pending por collector y no mezcla tenants", async function test() {
    const setup = await prepareCollectedPayments({ amounts: [20] });
    const tenantB = await prepareCollectedPayments({ amounts: [99] });
    const response = await getPendingCashSettlementsThroughApi({
      cookies: setup.scenario.business.auth.cookies,
      collectorUserId: setup.delivery.idUser,
    });
    const collectors = getPendingCollectors(response.body);

    expect(response.status).toBe(200);
    expect(collectors).toHaveLength(1);
    expect(collectors[0]?.collectorUserId).toBe(setup.delivery.idUser);
    expect(collectors[0]?.payments.map(function mapPayment(payment) {
      return payment.idSalePayment;
    })).toEqual([setup.salePaymentIds[0]]);
    expect(collectors[0]?.payments.map(function mapPayment(payment) {
      return payment.idSalePayment;
    })).not.toContain(tenantB.salePaymentIds[0]);
  });

  it("bloquea doble settlement concurrente del mismo pago", async function test() {
    const setup = await prepareCollectedPayments({ amounts: [20] });
    const responses = await Promise.all([
      createCashSettlementThroughApi({
        cookies: setup.scenario.business.auth.cookies,
        collectorUserId: setup.delivery.idUser,
        idCashSession: setup.idCashSession,
        salePaymentIds: [setup.salePaymentIds[0]],
      }),
      createCashSettlementThroughApi({
        cookies: setup.scenario.business.auth.cookies,
        collectorUserId: setup.delivery.idUser,
        idCashSession: setup.idCashSession,
        salePaymentIds: [setup.salePaymentIds[0]],
      }),
    ]);
    const successCount = responses.filter(function filterSuccess(response) {
      return response.status === 201;
    }).length;
    const rejectionCount = responses.filter(function filterRejected(response) {
      return response.status === 400;
    }).length;
    const settlementCount = await countRows("cash_settlements", "idBusiness = ?", [
      setup.scenario.business.business.idBusiness,
    ]);
    const settledEventCount = (await getSalePaymentEvents(setup.salePaymentIds[0])).filter(
      function filterSettled(event) {
        return event.event_type === "PAYMENT_SETTLED";
      },
    ).length;

    expect(successCount).toBe(1);
    expect(rejectionCount).toBe(1);
    expect(settlementCount).toBe(1);
    expect(settledEventCount).toBe(1);
  });
});
