import { beforeEach, describe, expect, it } from "vitest";
import { createBusinessUserFixture } from "@/tests/fixtures/business-user.fixture.js";
import { createEconomicFlowScenario } from "@/tests/fixtures/economic-flow.fixture.js";
import { loginBusinessTestUser } from "@/tests/helpers/business-auth-test.helper.js";
import {
  cancelSaleThroughApi,
  changeDeliveryStatusThroughApi,
  closeCashSessionThroughApi,
  collectSalePaymentThroughApi,
  confirmSalePaymentThroughApi,
  createSaleThroughApi,
  getDeliveryEventsThroughApi,
  getSalePaymentEventsThroughApi,
  listSalePaymentsThroughApi,
  openCashSessionThroughApi,
} from "@/tests/helpers/economic-http-test.helper.js";
import {
  decimalEquals,
  getDeliveryEvents,
  getDeliveryState,
  getSalePaymentEvents,
  getSalePaymentState,
  getSaleState,
  getStockQuantity,
} from "@/tests/helpers/economic-db-test.helper.js";
import { resetIntegrationTestData } from "@/tests/helpers/test-database.helper.js";

interface DeliveryAuth {
  idUser: number;
  cookies: string[];
}

async function createDeliveryAuth(
  idBusiness: number,
  usernamePrefix: string,
): Promise<DeliveryAuth> {
  const user = await createBusinessUserFixture({
    idBusiness,
    role: "DELIVERY",
    usernamePrefix,
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
    recipientName: "Cliente fase D",
    recipientPhone: "3815555555",
    deliveryAddress: "Direccion fase D 123",
    deliveryReference: "Casa",
    observation: "Delivery fase D",
  };
}

async function openCashSession(
  scenario: Awaited<ReturnType<typeof createEconomicFlowScenario>>,
): Promise<number> {
  const response = await openCashSessionThroughApi({
    cookies: scenario.business.auth.cookies,
    idCashRegister: scenario.cashRegister.idCashRegister,
    openingAmount: 0,
  });

  expect(response.status).toBe(201);
  return Number(response.body.data.idCashSession);
}

async function createPendingDeliverySale(input: {
  scenario: Awaited<ReturnType<typeof createEconomicFlowScenario>>;
  delivery: DeliveryAuth;
  idCashSession: number;
  total?: number;
}) {
  const total = input.total ?? 100;
  const response = await createSaleThroughApi({
    cookies: input.scenario.business.auth.cookies,
    idCustomer: null,
    idDeposit: input.scenario.sourceDeposit.idDeposit,
    idCashSession: input.idCashSession,
    subtotal: total,
    discountTotal: 0,
    total,
    observation: "Venta delivery fase D",
    payments: [
      {
        idPaymentMethod: input.scenario.cashPaymentMethod.idPaymentMethod,
        amount: total,
        status: "PENDING",
      },
    ],
    delivery: createDeliveryPayload(input.delivery.idUser),
    items: [
      {
        idProduct: input.scenario.product.idProduct,
        quantity: 1,
        unitPrice: total,
        discount: 0,
        total,
      },
    ],
  });

  expect(response.status).toBe(201);
  return response;
}

describe("economic delivery cancellation events and row-level flow", function suite() {
  beforeEach(async function resetData() {
    await resetIntegrationTestData();
  });

  it("permite anular delivery no cobrado aunque la caja original este cerrada", async function test() {
    const scenario = await createEconomicFlowScenario();
    const delivery = await createDeliveryAuth(
      scenario.business.business.idBusiness,
      "phase_d_delivery_cancel",
    );
    const idCashSession = await openCashSession(scenario);
    const sale = await createPendingDeliverySale({
      scenario,
      delivery,
      idCashSession,
    });
    const idSale = Number(sale.body.data.idSale);
    const idSalePayment = Number(sale.body.data.payments[0].idSalePayment);
    const idSaleDelivery = Number(sale.body.data.delivery.idSaleDelivery);

    const close = await closeCashSessionThroughApi({
      cookies: scenario.business.auth.cookies,
      idCashSession,
      countedCashAmount: 0,
    });
    const cancel = await cancelSaleThroughApi({
      cookies: scenario.business.auth.cookies,
      idSale,
    });
    const saleState = await getSaleState(idSale);
    const paymentState = await getSalePaymentState(idSalePayment);
    const deliveryState = await getDeliveryState(idSaleDelivery);
    const paymentEvents = await getSalePaymentEvents(idSalePayment);
    const deliveryEvents = await getDeliveryEvents(idSaleDelivery);
    const stock = await getStockQuantity({
      idBusiness: scenario.business.business.idBusiness,
      idProduct: scenario.product.idProduct,
      idDeposit: scenario.sourceDeposit.idDeposit,
    });

    expect(close.status).toBe(200);
    expect(cancel.status).toBe(200);
    expect(saleState?.status).toBe("CANCELLED");
    expect(paymentState?.status).toBe("CANCELLED");
    expect(paymentState?.cancelled_by_user_id).toBe(scenario.business.owner.idUser);
    expect(deliveryState?.status).toBe("CANCELLED");
    expect(decimalEquals(stock.toString(), 10)).toBe(true);
    expect(paymentEvents.at(-1)?.event_type).toBe("PAYMENT_CANCELLED");
    expect(paymentEvents.at(-1)?.created_by_user_id).toBe(
      scenario.business.owner.idUser,
    );
    expect(deliveryEvents.at(-1)?.event_type).toBe("DELIVERY_CANCELLED");
    expect(deliveryEvents.at(-1)?.created_by_user_id).toBe(
      scenario.business.owner.idUser,
    );
  });

  it("bloquea anular venta normal si su caja ya esta cerrada", async function test() {
    const scenario = await createEconomicFlowScenario();
    const idCashSession = await openCashSession(scenario);
    const sale = await createSaleThroughApi({
      cookies: scenario.business.auth.cookies,
      idCustomer: null,
      idDeposit: scenario.sourceDeposit.idDeposit,
      idCashSession,
      subtotal: 100,
      discountTotal: 0,
      total: 100,
      observation: "Venta normal cerrada",
      payments: [
        {
          idPaymentMethod: scenario.cashPaymentMethod.idPaymentMethod,
          amount: 100,
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
    const idSale = Number(sale.body.data.idSale);

    await closeCashSessionThroughApi({
      cookies: scenario.business.auth.cookies,
      idCashSession,
      countedCashAmount: 100,
    });
    const cancel = await cancelSaleThroughApi({
      cookies: scenario.business.auth.cookies,
      idSale,
    });
    const saleState = await getSaleState(idSale);

    expect(cancel.status).toBe(409);
    expect(cancel.body.message).toBe("CLOSED_CASH_SESSION_SALE_CANNOT_BE_CANCELLED");
    expect(saleState?.status).toBe("COMPLETED");
  });

  it("bloquea anular delivery con pago cobrado o confirmado", async function test() {
    const scenario = await createEconomicFlowScenario();
    const delivery = await createDeliveryAuth(
      scenario.business.business.idBusiness,
      "phase_d_delivery_paid",
    );
    const idCashSession = await openCashSession(scenario);
    const collectedSale = await createPendingDeliverySale({
      scenario,
      delivery,
      idCashSession,
      total: 100,
    });
    const confirmedSale = await createPendingDeliverySale({
      scenario,
      delivery,
      idCashSession,
      total: 120,
    });
    const collectedSaleId = Number(collectedSale.body.data.idSale);
    const confirmedSaleId = Number(confirmedSale.body.data.idSale);
    const collectedPaymentId = Number(
      collectedSale.body.data.payments[0].idSalePayment,
    );
    const confirmedPaymentId = Number(
      confirmedSale.body.data.payments[0].idSalePayment,
    );
    const collectedDeliveryId = Number(
      collectedSale.body.data.delivery.idSaleDelivery,
    );

    await changeDeliveryStatusThroughApi({
      cookies: scenario.business.auth.cookies,
      idSaleDelivery: collectedDeliveryId,
      action: "start",
    });
    await collectSalePaymentThroughApi({
      cookies: delivery.cookies,
      idSalePayment: collectedPaymentId,
    });
    await confirmSalePaymentThroughApi({
      cookies: scenario.business.auth.cookies,
      idSalePayment: confirmedPaymentId,
      idCashSession,
    });

    const cancelCollected = await cancelSaleThroughApi({
      cookies: scenario.business.auth.cookies,
      idSale: collectedSaleId,
    });
    const cancelConfirmed = await cancelSaleThroughApi({
      cookies: scenario.business.auth.cookies,
      idSale: confirmedSaleId,
    });

    expect(cancelCollected.status).toBe(400);
    expect(cancelCollected.body.message).toBe(
      "DELIVERY_SALE_IN_PROGRESS_CANNOT_BE_CANCELLED",
    );
    expect(cancelConfirmed.status).toBe(400);
    expect(cancelConfirmed.body.message).toBe(
      "DELIVERY_SALE_WITH_PAYMENTS_CANNOT_BE_CANCELLED",
    );
  });

  it("rechaza ASSIGNED a FAILED y permite FAILED solo desde OUT_FOR_DELIVERY", async function test() {
    const scenario = await createEconomicFlowScenario();
    const delivery = await createDeliveryAuth(
      scenario.business.business.idBusiness,
      "phase_d_delivery_state",
    );
    const idCashSession = await openCashSession(scenario);
    const sale = await createPendingDeliverySale({
      scenario,
      delivery,
      idCashSession,
    });
    const idSaleDelivery = Number(sale.body.data.delivery.idSaleDelivery);

    const directFail = await changeDeliveryStatusThroughApi({
      cookies: delivery.cookies,
      idSaleDelivery,
      action: "fail",
      failureReason: "No responde",
    });
    const start = await changeDeliveryStatusThroughApi({
      cookies: delivery.cookies,
      idSaleDelivery,
      action: "start",
    });
    const fail = await changeDeliveryStatusThroughApi({
      cookies: delivery.cookies,
      idSaleDelivery,
      action: "fail",
      failureReason: "Domicilio cerrado",
    });
    const events = await getDeliveryEvents(idSaleDelivery);

    expect(directFail.status).toBe(400);
    expect(directFail.body.message).toBe("DELIVERY_CANNOT_FAIL");
    expect(start.status).toBe(200);
    expect(fail.status).toBe(200);
    expect(fail.body.data.status).toBe("FAILED");
    expect(events.map(function mapEvent(event) {
      return event.event_type;
    })).toEqual([
      "DELIVERY_CREATED",
      "DELIVERY_OUT_FOR_DELIVERY",
      "DELIVERY_FAILED",
    ]);
  });

  it("aplica row-level en pagos y eventos para cadetes asignados", async function test() {
    const scenario = await createEconomicFlowScenario();
    const assignedDelivery = await createDeliveryAuth(
      scenario.business.business.idBusiness,
      "phase_d_delivery_owner",
    );
    const otherDelivery = await createDeliveryAuth(
      scenario.business.business.idBusiness,
      "phase_d_delivery_other",
    );
    const idCashSession = await openCashSession(scenario);
    const sale = await createPendingDeliverySale({
      scenario,
      delivery: assignedDelivery,
      idCashSession,
    });
    const idSale = Number(sale.body.data.idSale);
    const idSalePayment = Number(sale.body.data.payments[0].idSalePayment);
    const idSaleDelivery = Number(sale.body.data.delivery.idSaleDelivery);

    const ownerPayments = await listSalePaymentsThroughApi({
      cookies: scenario.business.auth.cookies,
      idSale,
    });
    const assignedPayments = await listSalePaymentsThroughApi({
      cookies: assignedDelivery.cookies,
      idSale,
    });
    const otherPayments = await listSalePaymentsThroughApi({
      cookies: otherDelivery.cookies,
      idSale,
    });
    const ownerDeliveryEvents = await getDeliveryEventsThroughApi({
      cookies: scenario.business.auth.cookies,
      idSaleDelivery,
    });
    const assignedDeliveryEvents = await getDeliveryEventsThroughApi({
      cookies: assignedDelivery.cookies,
      idSaleDelivery,
    });
    const otherDeliveryEvents = await getDeliveryEventsThroughApi({
      cookies: otherDelivery.cookies,
      idSaleDelivery,
    });
    const ownerPaymentEvents = await getSalePaymentEventsThroughApi({
      cookies: scenario.business.auth.cookies,
      idSalePayment,
    });
    const assignedPaymentEvents = await getSalePaymentEventsThroughApi({
      cookies: assignedDelivery.cookies,
      idSalePayment,
    });
    const otherPaymentEvents = await getSalePaymentEventsThroughApi({
      cookies: otherDelivery.cookies,
      idSalePayment,
    });

    expect(ownerPayments.status).toBe(200);
    expect(assignedPayments.status).toBe(200);
    expect(otherPayments.status).toBe(403);
    expect(ownerDeliveryEvents.status).toBe(200);
    expect(assignedDeliveryEvents.status).toBe(200);
    expect(otherDeliveryEvents.status).toBe(403);
    expect(ownerPaymentEvents.status).toBe(200);
    expect(assignedPaymentEvents.status).toBe(200);
    expect(otherPaymentEvents.status).toBe(403);
  });
});
