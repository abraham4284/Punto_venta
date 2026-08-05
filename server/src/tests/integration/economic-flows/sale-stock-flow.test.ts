import { beforeEach, describe, expect, it } from "vitest";
import {
  closeCashSessionThroughApi,
  createSaleThroughApi,
  openCashSessionThroughApi,
} from "@/tests/helpers/economic-http-test.helper.js";
import {
  countRows,
  decimalEquals,
  getSaleState,
  getStockMovementRows,
  getStockQuantity,
} from "@/tests/helpers/economic-db-test.helper.js";
import {
  executeMutation,
  resetIntegrationTestData,
} from "@/tests/helpers/test-database.helper.js";
import { createEconomicFlowScenario } from "@/tests/fixtures/economic-flow.fixture.js";

describe("economic sale stock flow", function suite() {
  beforeEach(async function resetData() {
    await resetIntegrationTestData();
  });

  it("registra una venta real CASH y descuenta stock", async function test() {
    const scenario = await createEconomicFlowScenario();
    const sessionResponse = await openCashSessionThroughApi({
      cookies: scenario.business.auth.cookies,
      idCashRegister: scenario.cashRegister.idCashRegister,
      openingAmount: 0,
    });
    const idCashSession = Number(sessionResponse.body.data.idCashSession);

    const response = await createSaleThroughApi({
      cookies: scenario.business.auth.cookies,
      idCustomer: scenario.customer.idCustomer,
      idDeposit: scenario.sourceDeposit.idDeposit,
      idCashSession,
      idPaymentMethod: scenario.cashPaymentMethod.idPaymentMethod,
      subtotal: 60,
      discountTotal: 0,
      total: 60,
      observation: "Venta descuenta stock",
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

    expect(response.status).toBe(201);
    const idSale = Number(response.body.data.idSale);
    const stock = await getStockQuantity({
      idBusiness: scenario.business.business.idBusiness,
      idProduct: scenario.product.idProduct,
      idDeposit: scenario.sourceDeposit.idDeposit,
    });
    const sale = await getSaleState(idSale);
    const detailCount = await countRows("sale_details", "idSale = ?", [idSale]);
    const movements = await getStockMovementRows({
      idBusiness: scenario.business.business.idBusiness,
      referenceType: "SALE",
      referenceId: idSale,
      idProduct: scenario.product.idProduct,
    });

    expect(decimalEquals(stock.toString(), 7)).toBe(true);
    expect(sale?.status).toBe("COMPLETED");
    expect(sale?.idCashSession).toBe(idCashSession);
    expect(sale?.idPaymentMethod).toBe(scenario.cashPaymentMethod.idPaymentMethod);
    expect(sale?.idUser).toBe(scenario.business.owner.idUser);
    expect(detailCount).toBe(1);
    expect(movements).toHaveLength(1);
    expect(movements[0]?.movement_type).toBe("SALE");
    expect(movements[0]?.idDepositFrom).toBe(scenario.sourceDeposit.idDeposit);
    expect(decimalEquals(movements[0]?.quantity, 3)).toBe(true);
  });

  it("registra venta de varias lineas y descuenta cada producto", async function test() {
    const scenario = await createEconomicFlowScenario();
    const sessionResponse = await openCashSessionThroughApi({
      cookies: scenario.business.auth.cookies,
      idCashRegister: scenario.cashRegister.idCashRegister,
      openingAmount: 0,
    });
    const idCashSession = Number(sessionResponse.body.data.idCashSession);

    const response = await createSaleThroughApi({
      cookies: scenario.business.auth.cookies,
      idCustomer: null,
      idDeposit: scenario.sourceDeposit.idDeposit,
      idCashSession,
      idPaymentMethod: scenario.cashPaymentMethod.idPaymentMethod,
      subtotal: 190,
      discountTotal: 0,
      total: 190,
      observation: "Venta multilinea",
      items: [
        {
          idProduct: scenario.product.idProduct,
          quantity: 2,
          unitPrice: 20,
          discount: 0,
          total: 40,
        },
        {
          idProduct: scenario.secondProduct.idProduct,
          quantity: 5,
          unitPrice: 30,
          discount: 0,
          total: 150,
        },
      ],
    });

    expect(response.status).toBe(201);
    const idSale = Number(response.body.data.idSale);
    const firstStock = await getStockQuantity({
      idBusiness: scenario.business.business.idBusiness,
      idProduct: scenario.product.idProduct,
      idDeposit: scenario.sourceDeposit.idDeposit,
    });
    const secondStock = await getStockQuantity({
      idBusiness: scenario.business.business.idBusiness,
      idProduct: scenario.secondProduct.idProduct,
      idDeposit: scenario.sourceDeposit.idDeposit,
    });
    const detailCount = await countRows("sale_details", "idSale = ?", [idSale]);
    const movements = await getStockMovementRows({
      idBusiness: scenario.business.business.idBusiness,
      referenceType: "SALE",
      referenceId: idSale,
    });

    expect(decimalEquals(firstStock.toString(), 8)).toBe(true);
    expect(decimalEquals(secondStock.toString(), 15)).toBe(true);
    expect(detailCount).toBe(2);
    expect(movements).toHaveLength(2);
  });

  it("rechaza venta sin caja abierta y no deja efectos parciales", async function test() {
    const scenario = await createEconomicFlowScenario();
    const beforeStock = await getStockQuantity({
      idBusiness: scenario.business.business.idBusiness,
      idProduct: scenario.product.idProduct,
      idDeposit: scenario.sourceDeposit.idDeposit,
    });

    const response = await createSaleThroughApi({
      cookies: scenario.business.auth.cookies,
      idCustomer: scenario.customer.idCustomer,
      idDeposit: scenario.sourceDeposit.idDeposit,
      idCashSession: 99999999,
      idPaymentMethod: scenario.cashPaymentMethod.idPaymentMethod,
      subtotal: 20,
      discountTotal: 0,
      total: 20,
      observation: "Venta sin caja",
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

    expect(response.status).toBe(409);
    expect(JSON.stringify(response.body)).toContain("OPEN_CASH_SESSION_REQUIRED");
    const afterStock = await getStockQuantity({
      idBusiness: scenario.business.business.idBusiness,
      idProduct: scenario.product.idProduct,
      idDeposit: scenario.sourceDeposit.idDeposit,
    });
    const saleCount = await countRows("sales", "observation = ?", [
      "Venta sin caja",
    ]);

    expect(afterStock.equals(beforeStock)).toBe(true);
    expect(saleCount).toBe(0);
  });

  it("hace rollback completo cuando una linea no tiene stock suficiente", async function test() {
    const scenario = await createEconomicFlowScenario();
    const sessionResponse = await openCashSessionThroughApi({
      cookies: scenario.business.auth.cookies,
      idCashRegister: scenario.cashRegister.idCashRegister,
      openingAmount: 0,
    });
    const idCashSession = Number(sessionResponse.body.data.idCashSession);
    const beforeFirst = await getStockQuantity({
      idBusiness: scenario.business.business.idBusiness,
      idProduct: scenario.product.idProduct,
      idDeposit: scenario.sourceDeposit.idDeposit,
    });
    const beforeSecond = await getStockQuantity({
      idBusiness: scenario.business.business.idBusiness,
      idProduct: scenario.secondProduct.idProduct,
      idDeposit: scenario.sourceDeposit.idDeposit,
    });

    const response = await createSaleThroughApi({
      cookies: scenario.business.auth.cookies,
      idCustomer: null,
      idDeposit: scenario.sourceDeposit.idDeposit,
      idCashSession,
      idPaymentMethod: scenario.cashPaymentMethod.idPaymentMethod,
      subtotal: 940,
      discountTotal: 0,
      total: 940,
      observation: "Venta rollback stock insuficiente",
      items: [
        {
          idProduct: scenario.product.idProduct,
          quantity: 2,
          unitPrice: 20,
          discount: 0,
          total: 40,
        },
        {
          idProduct: scenario.secondProduct.idProduct,
          quantity: 30,
          unitPrice: 30,
          discount: 0,
          total: 900,
        },
      ],
    });

    expect(response.status).toBe(400);
    const afterFirst = await getStockQuantity({
      idBusiness: scenario.business.business.idBusiness,
      idProduct: scenario.product.idProduct,
      idDeposit: scenario.sourceDeposit.idDeposit,
    });
    const afterSecond = await getStockQuantity({
      idBusiness: scenario.business.business.idBusiness,
      idProduct: scenario.secondProduct.idProduct,
      idDeposit: scenario.sourceDeposit.idDeposit,
    });
    const saleCount = await countRows("sales", "observation = ?", [
      "Venta rollback stock insuficiente",
    ]);
    const movementCount = await countRows(
      "stock_movements",
      "idBusiness = ? AND reference_type = 'SALE' AND observation = ?",
      [scenario.business.business.idBusiness, "Venta rollback stock insuficiente"],
    );

    expect(afterFirst.equals(beforeFirst)).toBe(true);
    expect(afterSecond.equals(beforeSecond)).toBe(true);
    expect(saleCount).toBe(0);
    expect(movementCount).toBe(0);
  });

  it("hace rollback cuando el metodo de pago esta inactivo", async function test() {
    const scenario = await createEconomicFlowScenario();
    const sessionResponse = await openCashSessionThroughApi({
      cookies: scenario.business.auth.cookies,
      idCashRegister: scenario.cashRegister.idCashRegister,
      openingAmount: 0,
    });
    const idCashSession = Number(sessionResponse.body.data.idCashSession);
    await executeMutation(
      "UPDATE payment_methods SET is_active = 0 WHERE idPaymentMethod = ?",
      [scenario.cashPaymentMethod.idPaymentMethod],
    );
    const beforeStock = await getStockQuantity({
      idBusiness: scenario.business.business.idBusiness,
      idProduct: scenario.product.idProduct,
      idDeposit: scenario.sourceDeposit.idDeposit,
    });

    const response = await createSaleThroughApi({
      cookies: scenario.business.auth.cookies,
      idCustomer: null,
      idDeposit: scenario.sourceDeposit.idDeposit,
      idCashSession,
      idPaymentMethod: scenario.cashPaymentMethod.idPaymentMethod,
      subtotal: 20,
      discountTotal: 0,
      total: 20,
      observation: "Venta metodo inactivo",
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

    expect(response.status).toBe(409);
    const afterStock = await getStockQuantity({
      idBusiness: scenario.business.business.idBusiness,
      idProduct: scenario.product.idProduct,
      idDeposit: scenario.sourceDeposit.idDeposit,
    });
    const saleCount = await countRows("sales", "observation = ?", [
      "Venta metodo inactivo",
    ]);

    expect(afterStock.equals(beforeStock)).toBe(true);
    expect(saleCount).toBe(0);
  });

  it("hace rollback cuando la sesion de caja esta cerrada", async function test() {
    const scenario = await createEconomicFlowScenario();
    const sessionResponse = await openCashSessionThroughApi({
      cookies: scenario.business.auth.cookies,
      idCashRegister: scenario.cashRegister.idCashRegister,
      openingAmount: 0,
    });
    const idCashSession = Number(sessionResponse.body.data.idCashSession);
    const closeResponse = await closeCashSessionThroughApi({
      cookies: scenario.business.auth.cookies,
      idCashSession,
      countedCashAmount: 0,
    });
    const beforeStock = await getStockQuantity({
      idBusiness: scenario.business.business.idBusiness,
      idProduct: scenario.product.idProduct,
      idDeposit: scenario.sourceDeposit.idDeposit,
    });

    const response = await createSaleThroughApi({
      cookies: scenario.business.auth.cookies,
      idCustomer: null,
      idDeposit: scenario.sourceDeposit.idDeposit,
      idCashSession,
      idPaymentMethod: scenario.cashPaymentMethod.idPaymentMethod,
      subtotal: 20,
      discountTotal: 0,
      total: 20,
      observation: "Venta sesion cerrada",
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

    expect(closeResponse.status).toBe(200);
    expect(response.status).toBe(409);
    const afterStock = await getStockQuantity({
      idBusiness: scenario.business.business.idBusiness,
      idProduct: scenario.product.idProduct,
      idDeposit: scenario.sourceDeposit.idDeposit,
    });
    const saleCount = await countRows("sales", "observation = ?", [
      "Venta sesion cerrada",
    ]);

    expect(afterStock.equals(beforeStock)).toBe(true);
    expect(saleCount).toBe(0);
  });
});
