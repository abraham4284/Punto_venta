import { beforeEach, describe, expect, it } from "vitest";
import {
  createPurchaseThroughApi,
  cancelPurchaseThroughApi,
} from "@/tests/helpers/economic-http-test.helper.js";
import {
  countRows,
  decimalEquals,
  getPurchaseState,
  getStockMovementRows,
  getStockQuantity,
} from "@/tests/helpers/economic-db-test.helper.js";
import { resetIntegrationTestData } from "@/tests/helpers/test-database.helper.js";
import { createEconomicFlowScenario } from "@/tests/fixtures/economic-flow.fixture.js";
import { createDepositFixture } from "@/tests/fixtures/deposit.fixture.js";

describe("economic purchase stock flow", function suite() {
  beforeEach(async function resetData() {
    await resetIntegrationTestData();
  });

  it("registra una compra real, aumenta stock y crea movimiento PURCHASE", async function test() {
    const scenario = await createEconomicFlowScenario();

    const response = await createPurchaseThroughApi({
      cookies: scenario.business.auth.cookies,
      idSupplier: scenario.supplier.idSupplier,
      subtotal: 50,
      discountTotal: 0,
      total: 50,
      observation: "Compra aumenta stock",
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
    });

    expect(response.status).toBe(201);
    const idPurchase = Number(response.body.data.idPurchase);
    const stock = await getStockQuantity({
      idBusiness: scenario.business.business.idBusiness,
      idProduct: scenario.product.idProduct,
      idDeposit: scenario.sourceDeposit.idDeposit,
    });
    const purchase = await getPurchaseState(idPurchase);
    const detailCount = await countRows("purchase_details", "idPurchase = ?", [
      idPurchase,
    ]);
    const movements = await getStockMovementRows({
      idBusiness: scenario.business.business.idBusiness,
      referenceType: "PURCHASE",
      referenceId: idPurchase,
      idProduct: scenario.product.idProduct,
    });

    expect(decimalEquals(stock.toString(), 15)).toBe(true);
    expect(purchase?.status).toBe("COMPLETED");
    expect(purchase?.idSupplier).toBe(scenario.supplier.idSupplier);
    expect(purchase?.idUser).toBe(scenario.business.owner.idUser);
    expect(decimalEquals(purchase?.total, 50)).toBe(true);
    expect(detailCount).toBe(1);
    expect(movements).toHaveLength(1);
    expect(movements[0]?.movement_type).toBe("PURCHASE");
    expect(decimalEquals(movements[0]?.quantity, 5)).toBe(true);
    expect(movements[0]?.idDepositTo).toBe(scenario.sourceDeposit.idDeposit);
  });

  it("crea fila de stock si una compra ingresa producto en deposito sin stock previo", async function test() {
    const scenario = await createEconomicFlowScenario();
    const newDeposit = await createDepositFixture(
      scenario.business.business.idBusiness,
      "Deposito sin stock previo",
    );

    const response = await createPurchaseThroughApi({
      cookies: scenario.business.auth.cookies,
      idSupplier: scenario.supplier.idSupplier,
      subtotal: 30,
      discountTotal: 0,
      total: 30,
      observation: "Compra crea stock",
      details: [
        {
          idProduct: scenario.product.idProduct,
          idDeposit: newDeposit.idDeposit,
          quantity: 3,
          unitPrice: 10,
          discountAmount: 0,
          subtotal: 30,
        },
      ],
    });

    expect(response.status).toBe(201);
    const stock = await getStockQuantity({
      idBusiness: scenario.business.business.idBusiness,
      idProduct: scenario.product.idProduct,
      idDeposit: newDeposit.idDeposit,
    });

    expect(decimalEquals(stock.toString(), 3)).toBe(true);
  });

  it("anula una compra real y restaura stock sin duplicar en segundo intento", async function test() {
    const scenario = await createEconomicFlowScenario();
    const purchaseResponse = await createPurchaseThroughApi({
      cookies: scenario.business.auth.cookies,
      idSupplier: scenario.supplier.idSupplier,
      subtotal: 50,
      discountTotal: 0,
      total: 50,
      observation: "Compra para anular",
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
    });
    const idPurchase = Number(purchaseResponse.body.data.idPurchase);

    const cancelResponse = await cancelPurchaseThroughApi({
      cookies: scenario.business.auth.cookies,
      idPurchase,
    });
    const secondCancel = await cancelPurchaseThroughApi({
      cookies: scenario.business.auth.cookies,
      idPurchase,
    });

    expect(cancelResponse.status).toBe(200);
    expect(secondCancel.status).toBe(400);
    const stock = await getStockQuantity({
      idBusiness: scenario.business.business.idBusiness,
      idProduct: scenario.product.idProduct,
      idDeposit: scenario.sourceDeposit.idDeposit,
    });
    const purchase = await getPurchaseState(idPurchase);

    expect(decimalEquals(stock.toString(), 10)).toBe(true);
    expect(purchase?.status).toBe("CANCELLED");
  });

  it("hace rollback de compra invalida sin cabecera, detalles, stock ni movimientos", async function test() {
    const scenario = await createEconomicFlowScenario();
    const beforeStock = await getStockQuantity({
      idBusiness: scenario.business.business.idBusiness,
      idProduct: scenario.product.idProduct,
      idDeposit: scenario.sourceDeposit.idDeposit,
    });

    const response = await createPurchaseThroughApi({
      cookies: scenario.business.auth.cookies,
      idSupplier: scenario.supplier.idSupplier,
      subtotal: 60,
      discountTotal: 0,
      total: 60,
      observation: "Compra invalida rollback",
      details: [
        {
          idProduct: scenario.product.idProduct,
          idDeposit: scenario.sourceDeposit.idDeposit,
          quantity: 5,
          unitPrice: 10,
          discountAmount: 0,
          subtotal: 50,
        },
        {
          idProduct: 99999999,
          idDeposit: scenario.sourceDeposit.idDeposit,
          quantity: 1,
          unitPrice: 10,
          discountAmount: 0,
          subtotal: 10,
        },
      ],
    });

    expect(response.status).toBe(400);
    const afterStock = await getStockQuantity({
      idBusiness: scenario.business.business.idBusiness,
      idProduct: scenario.product.idProduct,
      idDeposit: scenario.sourceDeposit.idDeposit,
    });
    const purchaseCount = await countRows("purchases", "observation = ?", [
      "Compra invalida rollback",
    ]);
    const movementCount = await countRows(
      "stock_movements",
      "idBusiness = ? AND reference_type = 'PURCHASE' AND observation = ?",
      [scenario.business.business.idBusiness, "Compra invalida rollback"],
    );

    expect(afterStock.equals(beforeStock)).toBe(true);
    expect(purchaseCount).toBe(0);
    expect(movementCount).toBe(0);
  });
});
