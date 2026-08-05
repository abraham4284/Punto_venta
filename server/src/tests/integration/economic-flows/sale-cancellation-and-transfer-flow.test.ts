import { beforeEach, describe, expect, it } from "vitest";
import {
  cancelSaleThroughApi,
  createSaleThroughApi,
  openCashSessionThroughApi,
  transferStockThroughApi,
} from "@/tests/helpers/economic-http-test.helper.js";
import {
  countRows,
  decimalEquals,
  getSaleState,
  getStockMovementRows,
  getStockQuantity,
} from "@/tests/helpers/economic-db-test.helper.js";
import { resetIntegrationTestData } from "@/tests/helpers/test-database.helper.js";
import { createEconomicFlowScenario } from "@/tests/fixtures/economic-flow.fixture.js";

describe("economic sale cancellation and stock transfer flow", function suite() {
  beforeEach(async function resetData() {
    await resetIntegrationTestData();
  });

  it("anula una venta real y restaura stock sin duplicar en segundo intento", async function test() {
    const scenario = await createEconomicFlowScenario();
    const sessionResponse = await openCashSessionThroughApi({
      cookies: scenario.business.auth.cookies,
      idCashRegister: scenario.cashRegister.idCashRegister,
      openingAmount: 0,
    });
    const idCashSession = Number(sessionResponse.body.data.idCashSession);
    const saleResponse = await createSaleThroughApi({
      cookies: scenario.business.auth.cookies,
      idCustomer: null,
      idDeposit: scenario.sourceDeposit.idDeposit,
      idCashSession,
      idPaymentMethod: scenario.cashPaymentMethod.idPaymentMethod,
      subtotal: 60,
      discountTotal: 0,
      total: 60,
      observation: "Venta para anular",
      items: [
        {
          idProduct: scenario.product.idProduct,
          quantity: 3,
          unitPrice: 20,
          discount: 0,
          total: 60,
        },
      ],
    });
    const idSale = Number(saleResponse.body.data.idSale);
    const stockAfterSale = await getStockQuantity({
      idBusiness: scenario.business.business.idBusiness,
      idProduct: scenario.product.idProduct,
      idDeposit: scenario.sourceDeposit.idDeposit,
    });

    const cancelResponse = await cancelSaleThroughApi({
      cookies: scenario.business.auth.cookies,
      idSale,
    });
    const secondCancel = await cancelSaleThroughApi({
      cookies: scenario.business.auth.cookies,
      idSale,
    });

    expect(decimalEquals(stockAfterSale.toString(), 7)).toBe(true);
    expect(cancelResponse.status).toBe(200);
    expect(secondCancel.status).toBe(400);
    const stockAfterCancel = await getStockQuantity({
      idBusiness: scenario.business.business.idBusiness,
      idProduct: scenario.product.idProduct,
      idDeposit: scenario.sourceDeposit.idDeposit,
    });
    const sale = await getSaleState(idSale);
    const saleMovements = await getStockMovementRows({
      idBusiness: scenario.business.business.idBusiness,
      referenceType: "SALE",
      referenceId: idSale,
      idProduct: scenario.product.idProduct,
    });

    expect(decimalEquals(stockAfterCancel.toString(), 10)).toBe(true);
    expect(sale?.status).toBe("CANCELLED");
    expect(saleMovements).toHaveLength(1);
  });

  it("transfiere stock entre depositos, conserva total y crea TRANSFER_OUT/TRANSFER_IN", async function test() {
    const scenario = await createEconomicFlowScenario();
    const beforeSource = await getStockQuantity({
      idBusiness: scenario.business.business.idBusiness,
      idProduct: scenario.product.idProduct,
      idDeposit: scenario.sourceDeposit.idDeposit,
    });
    const beforeDestination = await getStockQuantity({
      idBusiness: scenario.business.business.idBusiness,
      idProduct: scenario.product.idProduct,
      idDeposit: scenario.destinationDeposit.idDeposit,
    });

    const response = await transferStockThroughApi({
      cookies: scenario.business.auth.cookies,
      idProduct: scenario.product.idProduct,
      idDepositFrom: scenario.sourceDeposit.idDeposit,
      idDepositTo: scenario.destinationDeposit.idDeposit,
      quantity: 4,
      observation: "Transferencia economica",
    });

    expect(response.status).toBe(200);
    const afterSource = await getStockQuantity({
      idBusiness: scenario.business.business.idBusiness,
      idProduct: scenario.product.idProduct,
      idDeposit: scenario.sourceDeposit.idDeposit,
    });
    const afterDestination = await getStockQuantity({
      idBusiness: scenario.business.business.idBusiness,
      idProduct: scenario.product.idProduct,
      idDeposit: scenario.destinationDeposit.idDeposit,
    });
    const movements = await getStockMovementRows({
      idBusiness: scenario.business.business.idBusiness,
      referenceType: "TRANSFER",
      idProduct: scenario.product.idProduct,
      observation: "Transferencia economica",
    });

    expect(decimalEquals(beforeSource.plus(beforeDestination).toString(), 12)).toBe(true);
    expect(decimalEquals(afterSource.toString(), 6)).toBe(true);
    expect(decimalEquals(afterDestination.toString(), 6)).toBe(true);
    expect(afterSource.plus(afterDestination).equals(beforeSource.plus(beforeDestination))).toBe(true);
    expect(movements).toHaveLength(2);
    expect(movements.map(function mapMovement(movement) {
      return movement.movement_type;
    })).toEqual(["TRANSFER_OUT", "TRANSFER_IN"]);
    expect(movements[0]?.reference_id).toBe(movements[1]?.reference_id);
  });

  it("rollback de transferencia con stock insuficiente no deja cambios ni movimientos", async function test() {
    const scenario = await createEconomicFlowScenario();
    const beforeSource = await getStockQuantity({
      idBusiness: scenario.business.business.idBusiness,
      idProduct: scenario.product.idProduct,
      idDeposit: scenario.sourceDeposit.idDeposit,
    });
    const beforeDestination = await getStockQuantity({
      idBusiness: scenario.business.business.idBusiness,
      idProduct: scenario.product.idProduct,
      idDeposit: scenario.destinationDeposit.idDeposit,
    });

    const response = await transferStockThroughApi({
      cookies: scenario.business.auth.cookies,
      idProduct: scenario.product.idProduct,
      idDepositFrom: scenario.sourceDeposit.idDeposit,
      idDepositTo: scenario.destinationDeposit.idDeposit,
      quantity: 50,
      observation: "Transferencia insuficiente",
    });

    expect(response.status).toBe(400);
    const afterSource = await getStockQuantity({
      idBusiness: scenario.business.business.idBusiness,
      idProduct: scenario.product.idProduct,
      idDeposit: scenario.sourceDeposit.idDeposit,
    });
    const afterDestination = await getStockQuantity({
      idBusiness: scenario.business.business.idBusiness,
      idProduct: scenario.product.idProduct,
      idDeposit: scenario.destinationDeposit.idDeposit,
    });
    const movementCount = await countRows(
      "stock_movements",
      "idBusiness = ? AND reference_type = 'TRANSFER' AND observation = ?",
      [scenario.business.business.idBusiness, "Transferencia insuficiente"],
    );

    expect(afterSource.equals(beforeSource)).toBe(true);
    expect(afterDestination.equals(beforeDestination)).toBe(true);
    expect(movementCount).toBe(0);
  });

  it("rechaza transferencia al mismo deposito sin modificar stock", async function test() {
    const scenario = await createEconomicFlowScenario();
    const before = await getStockQuantity({
      idBusiness: scenario.business.business.idBusiness,
      idProduct: scenario.product.idProduct,
      idDeposit: scenario.sourceDeposit.idDeposit,
    });

    const response = await transferStockThroughApi({
      cookies: scenario.business.auth.cookies,
      idProduct: scenario.product.idProduct,
      idDepositFrom: scenario.sourceDeposit.idDeposit,
      idDepositTo: scenario.sourceDeposit.idDeposit,
      quantity: 1,
      observation: "Transferencia mismo deposito",
    });

    expect(response.status).toBe(400);
    const after = await getStockQuantity({
      idBusiness: scenario.business.business.idBusiness,
      idProduct: scenario.product.idProduct,
      idDeposit: scenario.sourceDeposit.idDeposit,
    });
    const movementCount = await countRows(
      "stock_movements",
      "idBusiness = ? AND reference_type = 'TRANSFER' AND observation = ?",
      [scenario.business.business.idBusiness, "Transferencia mismo deposito"],
    );

    expect(after.equals(before)).toBe(true);
    expect(movementCount).toBe(0);
  });
});
