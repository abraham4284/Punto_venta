import { randomUUID } from "crypto";
import { beforeEach, describe, expect, it } from "vitest";
import {
  createPurchaseThroughApi,
  createSaleThroughApi,
  openCashSessionThroughApi,
} from "@/tests/helpers/economic-http-test.helper.js";
import {
  countRows,
  decimalEquals,
  getStockMovementRows,
  getStockQuantity,
} from "@/tests/helpers/economic-db-test.helper.js";
import {
  executeMutation,
  resetIntegrationTestData,
} from "@/tests/helpers/test-database.helper.js";
import { createEconomicFlowScenario } from "@/tests/fixtures/economic-flow.fixture.js";

async function openScenarioCashSession(
  scenario: Awaited<ReturnType<typeof createEconomicFlowScenario>>,
): Promise<number> {
  const response = await openCashSessionThroughApi({
    cookies: scenario.business.auth.cookies,
    idCashRegister: scenario.cashRegister.idCashRegister,
    openingAmount: 0,
  });

  return Number(response.body.data.idCashSession);
}

describe("economic idempotency and stock concurrency flow", function suite() {
  beforeEach(async function resetData() {
    await resetIntegrationTestData();
  });

  it("no duplica una venta secuencial con la misma Idempotency-Key", async function test() {
    const scenario = await createEconomicFlowScenario();
    const idCashSession = await openScenarioCashSession(scenario);
    const idempotencyKey = randomUUID();
    const salePayload = {
      cookies: scenario.business.auth.cookies,
      idCustomer: scenario.customer.idCustomer,
      idDeposit: scenario.sourceDeposit.idDeposit,
      idCashSession,
      idPaymentMethod: scenario.cashPaymentMethod.idPaymentMethod,
      subtotal: 40,
      discountTotal: 0,
      total: 40,
      observation: "Venta idempotente secuencial",
      idempotencyKey,
      items: [
        {
          idProduct: scenario.product.idProduct,
          quantity: 2,
          unitPrice: 20,
          discount: 0,
          total: 40,
        },
      ],
    };

    const firstResponse = await createSaleThroughApi(salePayload);
    const secondResponse = await createSaleThroughApi(salePayload);
    const idSale = Number(firstResponse.body.data.idSale);
    const stock = await getStockQuantity({
      idBusiness: scenario.business.business.idBusiness,
      idProduct: scenario.product.idProduct,
      idDeposit: scenario.sourceDeposit.idDeposit,
    });
    const salesCount = await countRows(
      "sales",
      "idBusiness = ? AND idempotency_key = ?",
      [scenario.business.business.idBusiness, idempotencyKey],
    );
    const detailsCount = await countRows("sale_details", "idSale = ?", [idSale]);
    const movements = await getStockMovementRows({
      idBusiness: scenario.business.business.idBusiness,
      referenceType: "SALE",
      referenceId: idSale,
      idProduct: scenario.product.idProduct,
    });

    expect(firstResponse.status).toBe(201);
    expect(secondResponse.status).toBe(200);
    expect(secondResponse.body.idempotentReplay).toBe(true);
    expect(secondResponse.body.data.idSale).toBe(firstResponse.body.data.idSale);
    expect(secondResponse.body.data.saleNumber).toBe(firstResponse.body.data.saleNumber);
    expect(salesCount).toBe(1);
    expect(detailsCount).toBe(1);
    expect(movements).toHaveLength(1);
    expect(decimalEquals(stock.toString(), 8)).toBe(true);
  });

  it("no duplica una venta concurrente con la misma Idempotency-Key", async function test() {
    const scenario = await createEconomicFlowScenario();
    const idCashSession = await openScenarioCashSession(scenario);
    const idempotencyKey = randomUUID();
    const salePayload = {
      cookies: scenario.business.auth.cookies,
      idCustomer: null,
      idDeposit: scenario.sourceDeposit.idDeposit,
      idCashSession,
      idPaymentMethod: scenario.cashPaymentMethod.idPaymentMethod,
      subtotal: 40,
      discountTotal: 0,
      total: 40,
      observation: "Venta idempotente concurrente",
      idempotencyKey,
      items: [
        {
          idProduct: scenario.product.idProduct,
          quantity: 2,
          unitPrice: 20,
          discount: 0,
          total: 40,
        },
      ],
    };

    const [firstResponse, secondResponse] = await Promise.all([
      createSaleThroughApi(salePayload),
      createSaleThroughApi(salePayload),
    ]);
    const successResponse = [firstResponse, secondResponse].find(
      (response) => response.status === 201,
    );
    const replayResponse = [firstResponse, secondResponse].find(
      (response) => response.status === 200,
    );
    const idSale = Number(successResponse?.body.data.idSale);
    const stock = await getStockQuantity({
      idBusiness: scenario.business.business.idBusiness,
      idProduct: scenario.product.idProduct,
      idDeposit: scenario.sourceDeposit.idDeposit,
    });
    const salesCount = await countRows(
      "sales",
      "idBusiness = ? AND idempotency_key = ?",
      [scenario.business.business.idBusiness, idempotencyKey],
    );
    const detailsCount = await countRows("sale_details", "idSale = ?", [idSale]);
    const movements = await getStockMovementRows({
      idBusiness: scenario.business.business.idBusiness,
      referenceType: "SALE",
      referenceId: idSale,
      idProduct: scenario.product.idProduct,
    });

    expect([firstResponse.status, secondResponse.status].sort()).toEqual([200, 201]);
    expect(replayResponse?.body.idempotentReplay).toBe(true);
    expect(replayResponse?.body.data.idSale).toBe(successResponse?.body.data.idSale);
    expect(salesCount).toBe(1);
    expect(detailsCount).toBe(1);
    expect(movements).toHaveLength(1);
    expect(decimalEquals(stock.toString(), 8)).toBe(true);
  });

  it("evita stock negativo con dos ventas concurrentes distintas sobre stock limite", async function test() {
    const scenario = await createEconomicFlowScenario();
    const idCashSession = await openScenarioCashSession(scenario);
    await executeMutation(
      "UPDATE stock SET quantity = 1 WHERE idBusiness = ? AND idProduct = ? AND idDeposit = ?",
      [
        scenario.business.business.idBusiness,
        scenario.product.idProduct,
        scenario.sourceDeposit.idDeposit,
      ],
    );

    const basePayload = {
      cookies: scenario.business.auth.cookies,
      idCustomer: null,
      idDeposit: scenario.sourceDeposit.idDeposit,
      idCashSession,
      idPaymentMethod: scenario.cashPaymentMethod.idPaymentMethod,
      subtotal: 20,
      discountTotal: 0,
      total: 20,
      items: [
        {
          idProduct: scenario.product.idProduct,
          quantity: 1,
          unitPrice: 20,
          discount: 0,
          total: 20,
        },
      ],
    };

    const [firstResponse, secondResponse] = await Promise.all([
      createSaleThroughApi({
        ...basePayload,
        observation: "Venta stock limite A",
        idempotencyKey: randomUUID(),
      }),
      createSaleThroughApi({
        ...basePayload,
        observation: "Venta stock limite B",
        idempotencyKey: randomUUID(),
      }),
    ]);
    const successResponses = [firstResponse, secondResponse].filter(
      (response) => response.status === 201,
    );
    const rejectedResponses = [firstResponse, secondResponse].filter(
      (response) => response.status !== 201,
    );
    const stock = await getStockQuantity({
      idBusiness: scenario.business.business.idBusiness,
      idProduct: scenario.product.idProduct,
      idDeposit: scenario.sourceDeposit.idDeposit,
    });
    const completedSales = await countRows(
      "sales",
      "idBusiness = ? AND status = 'COMPLETED'",
      [scenario.business.business.idBusiness],
    );
    const movements = await getStockMovementRows({
      idBusiness: scenario.business.business.idBusiness,
      referenceType: "SALE",
      idProduct: scenario.product.idProduct,
    });

    expect(successResponses).toHaveLength(1);
    expect(rejectedResponses).toHaveLength(1);
    expect(JSON.stringify(rejectedResponses[0]?.body)).toContain("Stock insuficiente");
    expect(decimalEquals(stock.toString(), 0)).toBe(true);
    expect(completedSales).toBe(1);
    expect(movements).toHaveLength(1);
  });

  it("permite ventas concurrentes distintas cuando el stock alcanza", async function test() {
    const scenario = await createEconomicFlowScenario();
    const idCashSession = await openScenarioCashSession(scenario);

    const [firstResponse, secondResponse] = await Promise.all([
      createSaleThroughApi({
        cookies: scenario.business.auth.cookies,
        idCustomer: null,
        idDeposit: scenario.sourceDeposit.idDeposit,
        idCashSession,
        idPaymentMethod: scenario.cashPaymentMethod.idPaymentMethod,
        subtotal: 40,
        discountTotal: 0,
        total: 40,
        observation: "Venta concurrente suficiente A",
        idempotencyKey: randomUUID(),
        items: [
          {
            idProduct: scenario.product.idProduct,
            quantity: 2,
            unitPrice: 20,
            discount: 0,
            total: 40,
          },
        ],
      }),
      createSaleThroughApi({
        cookies: scenario.business.auth.cookies,
        idCustomer: null,
        idDeposit: scenario.sourceDeposit.idDeposit,
        idCashSession,
        idPaymentMethod: scenario.cashPaymentMethod.idPaymentMethod,
        subtotal: 60,
        discountTotal: 0,
        total: 60,
        observation: "Venta concurrente suficiente B",
        idempotencyKey: randomUUID(),
        items: [
          {
            idProduct: scenario.product.idProduct,
            quantity: 3,
            unitPrice: 20,
            discount: 0,
            total: 60,
          },
        ],
      }),
    ]);
    const stock = await getStockQuantity({
      idBusiness: scenario.business.business.idBusiness,
      idProduct: scenario.product.idProduct,
      idDeposit: scenario.sourceDeposit.idDeposit,
    });

    expect(firstResponse.status).toBe(201);
    expect(secondResponse.status).toBe(201);
    expect(decimalEquals(stock.toString(), 5)).toBe(true);
  });

  it("no duplica una compra secuencial con la misma Idempotency-Key", async function test() {
    const scenario = await createEconomicFlowScenario();
    const idempotencyKey = randomUUID();
    const purchasePayload = {
      cookies: scenario.business.auth.cookies,
      idSupplier: scenario.supplier.idSupplier,
      subtotal: 50,
      discountTotal: 0,
      total: 50,
      observation: "Compra idempotente secuencial",
      idempotencyKey,
      details: [
        {
          idProduct: scenario.product.idProduct,
          idDeposit: scenario.sourceDeposit.idDeposit,
          quantity: 5,
          unitPrice: 10,
          discountAmount: 0,
          subtotal: 50,
        },
      ],
    };

    const firstResponse = await createPurchaseThroughApi(purchasePayload);
    const secondResponse = await createPurchaseThroughApi(purchasePayload);
    const idPurchase = Number(firstResponse.body.data.idPurchase);
    const stock = await getStockQuantity({
      idBusiness: scenario.business.business.idBusiness,
      idProduct: scenario.product.idProduct,
      idDeposit: scenario.sourceDeposit.idDeposit,
    });
    const purchasesCount = await countRows(
      "purchases",
      "idBusiness = ? AND idempotency_key = ?",
      [scenario.business.business.idBusiness, idempotencyKey],
    );
    const detailsCount = await countRows("purchase_details", "idPurchase = ?", [
      idPurchase,
    ]);
    const movements = await getStockMovementRows({
      idBusiness: scenario.business.business.idBusiness,
      referenceType: "PURCHASE",
      referenceId: idPurchase,
      idProduct: scenario.product.idProduct,
    });

    expect(firstResponse.status).toBe(201);
    expect(secondResponse.status).toBe(200);
    expect(secondResponse.body.idempotentReplay).toBe(true);
    expect(secondResponse.body.data.idPurchase).toBe(firstResponse.body.data.idPurchase);
    expect(secondResponse.body.data.purchaseNumber).toBe(
      firstResponse.body.data.purchaseNumber,
    );
    expect(purchasesCount).toBe(1);
    expect(detailsCount).toBe(1);
    expect(movements).toHaveLength(1);
    expect(decimalEquals(stock.toString(), 15)).toBe(true);
  });

  it("no duplica una compra concurrente con la misma Idempotency-Key", async function test() {
    const scenario = await createEconomicFlowScenario();
    const idempotencyKey = randomUUID();
    const purchasePayload = {
      cookies: scenario.business.auth.cookies,
      idSupplier: scenario.supplier.idSupplier,
      subtotal: 50,
      discountTotal: 0,
      total: 50,
      observation: "Compra idempotente concurrente",
      idempotencyKey,
      details: [
        {
          idProduct: scenario.product.idProduct,
          idDeposit: scenario.sourceDeposit.idDeposit,
          quantity: 5,
          unitPrice: 10,
          discountAmount: 0,
          subtotal: 50,
        },
      ],
    };

    const [firstResponse, secondResponse] = await Promise.all([
      createPurchaseThroughApi(purchasePayload),
      createPurchaseThroughApi(purchasePayload),
    ]);
    const successResponse = [firstResponse, secondResponse].find(
      (response) => response.status === 201,
    );
    const replayResponse = [firstResponse, secondResponse].find(
      (response) => response.status === 200,
    );
    const idPurchase = Number(successResponse?.body.data.idPurchase);
    const stock = await getStockQuantity({
      idBusiness: scenario.business.business.idBusiness,
      idProduct: scenario.product.idProduct,
      idDeposit: scenario.sourceDeposit.idDeposit,
    });
    const purchasesCount = await countRows(
      "purchases",
      "idBusiness = ? AND idempotency_key = ?",
      [scenario.business.business.idBusiness, idempotencyKey],
    );
    const detailsCount = await countRows("purchase_details", "idPurchase = ?", [
      idPurchase,
    ]);
    const movements = await getStockMovementRows({
      idBusiness: scenario.business.business.idBusiness,
      referenceType: "PURCHASE",
      referenceId: idPurchase,
      idProduct: scenario.product.idProduct,
    });

    expect([firstResponse.status, secondResponse.status].sort()).toEqual([200, 201]);
    expect(replayResponse?.body.idempotentReplay).toBe(true);
    expect(replayResponse?.body.data.idPurchase).toBe(
      successResponse?.body.data.idPurchase,
    );
    expect(purchasesCount).toBe(1);
    expect(detailsCount).toBe(1);
    expect(movements).toHaveLength(1);
    expect(decimalEquals(stock.toString(), 15)).toBe(true);
  });
});
