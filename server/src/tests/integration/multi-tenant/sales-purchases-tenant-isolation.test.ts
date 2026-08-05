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
import { createProductCategoryFixture } from "@/tests/fixtures/product-category.fixture.js";
import { createProductFixture } from "@/tests/fixtures/product.fixture.js";
import { createCustomerFixture } from "@/tests/fixtures/customer.fixture.js";
import { createSupplierFixture } from "@/tests/fixtures/supplier.fixture.js";
import { createCashSessionFixture } from "@/tests/fixtures/cash-session.fixture.js";
import { createSaleFixture } from "@/tests/fixtures/sale.fixture.js";
import { createPurchaseFixture } from "@/tests/fixtures/purchase.fixture.js";
import {
  expectResponseDoesNotLeak,
  expectTenantBlocked,
  extractArrayFromBody,
} from "@/tests/helpers/tenant-assertions.helper.js";

interface CountRow extends RowDataPacket {
  total: number;
}

interface SaleStatusRow extends RowDataPacket {
  status: "COMPLETED" | "CANCELLED";
}

interface StockQuantityRow extends RowDataPacket {
  quantity: string;
}

describe("multi-tenant sales and purchases", function suite() {
  let scenario: TwoTenantScenario;

  beforeEach(async function setupScenario() {
    await resetIntegrationTestData();
    scenario = await createTwoTenantScenario();
  });

  async function createTenantProduct(tenant: TwoTenantScenario["tenantA"]) {
    const category = await createProductCategoryFixture(tenant.business.idBusiness);
    return createProductFixture({
      idBusiness: tenant.business.idBusiness,
      idProductCategory: category.idProductCategory,
      idDeposit: tenant.defaultDeposit.idDeposit,
      quantity: 10,
    });
  }

  it("aisla listado de ventas por negocio", async function test() {
    const productA = await createTenantProduct(scenario.tenantA);
    const productB = await createTenantProduct(scenario.tenantB);
    const sessionA = await createCashSessionFixture({
      idBusiness: scenario.tenantA.business.idBusiness,
      idCashRegister: scenario.tenantA.defaultCashRegister.idCashRegister,
      idUser: scenario.tenantA.owner.idUser,
    });
    const sessionB = await createCashSessionFixture({
      idBusiness: scenario.tenantB.business.idBusiness,
      idCashRegister: scenario.tenantB.defaultCashRegister.idCashRegister,
      idUser: scenario.tenantB.owner.idUser,
    });
    const saleA = await createSaleFixture({
      idBusiness: scenario.tenantA.business.idBusiness,
      idDeposit: scenario.tenantA.defaultDeposit.idDeposit,
      idCashSession: sessionA.idCashSession,
      idUser: scenario.tenantA.owner.idUser,
      idPaymentMethod: scenario.tenantA.cashPaymentMethod.idPaymentMethod,
      idProduct: productA.idProduct,
    });
    const saleB = await createSaleFixture({
      idBusiness: scenario.tenantB.business.idBusiness,
      idDeposit: scenario.tenantB.defaultDeposit.idDeposit,
      idCashSession: sessionB.idCashSession,
      idUser: scenario.tenantB.owner.idUser,
      idPaymentMethod: scenario.tenantB.cashPaymentMethod.idPaymentMethod,
      idProduct: productB.idProduct,
    });

    const response = await request(getTestApp())
      .get("/api/sales")
      .set("Cookie", scenario.tenantB.auth.cookies);

    expect(response.status).toBe(200);
    const body = JSON.stringify(extractArrayFromBody(response.body));
    expect(body).toContain(saleB.saleNumber);
    expect(body).not.toContain(saleA.saleNumber);
  });

  it("bloquea detalle y anulacion de venta ajena sin cambiar estado", async function test() {
    const productA = await createTenantProduct(scenario.tenantA);
    const sessionA = await createCashSessionFixture({
      idBusiness: scenario.tenantA.business.idBusiness,
      idCashRegister: scenario.tenantA.defaultCashRegister.idCashRegister,
      idUser: scenario.tenantA.owner.idUser,
    });
    const saleA = await createSaleFixture({
      idBusiness: scenario.tenantA.business.idBusiness,
      idDeposit: scenario.tenantA.defaultDeposit.idDeposit,
      idCashSession: sessionA.idCashSession,
      idUser: scenario.tenantA.owner.idUser,
      idPaymentMethod: scenario.tenantA.cashPaymentMethod.idPaymentMethod,
      idProduct: productA.idProduct,
    });

    const detail = await request(getTestApp())
      .get(`/api/sales/${saleA.idSale}`)
      .set("Cookie", scenario.tenantB.auth.cookies);
    const cancel = await request(getTestApp())
      .patch(`/api/sales/${saleA.idSale}/cancel`)
      .set("Cookie", scenario.tenantB.auth.cookies)
      .send({});

    expectTenantBlocked(detail);
    expectTenantBlocked(cancel);
    expectResponseDoesNotLeak(detail, saleA.saleNumber);

    const state = await querySingleRow<SaleStatusRow>(
      "SELECT status FROM sales WHERE idSale = ?",
      [saleA.idSale],
    );

    expect(state?.status).toBe("COMPLETED");
  });

  it("bloquea venta con producto ajeno, metodo ajeno, cliente ajeno y no crea registros", async function test() {
    const productA = await createTenantProduct(scenario.tenantA);
    const customerA = await createCustomerFixture(scenario.tenantA.business.idBusiness);
    const sessionB = await createCashSessionFixture({
      idBusiness: scenario.tenantB.business.idBusiness,
      idCashRegister: scenario.tenantB.defaultCashRegister.idCashRegister,
      idUser: scenario.tenantB.owner.idUser,
    });

    const response = await request(getTestApp())
      .post("/api/sales")
      .set("Cookie", scenario.tenantB.auth.cookies)
      .send({
        idCustomer: customerA.idCustomer,
        idDeposit: scenario.tenantB.defaultDeposit.idDeposit,
        idCashSession: sessionB.idCashSession,
        idPaymentMethod: scenario.tenantA.cashPaymentMethod.idPaymentMethod,
        subtotal: 20,
        discountTotal: 0,
        total: 20,
        observation: "Venta cruzada no permitida",
        items: [
          {
            idProduct: productA.idProduct,
            quantity: 1,
            unitPrice: 20,
            discount: 0,
            total: 20,
          },
        ],
      });

    expectTenantBlocked(response);
    const saleCount = await querySingleRow<CountRow>(
      "SELECT COUNT(*) AS total FROM sales WHERE observation = ?",
      ["Venta cruzada no permitida"],
    );
    const detailCount = await querySingleRow<CountRow>(
      `SELECT COUNT(*) AS total
       FROM sale_details sd
       INNER JOIN sales s ON s.idSale = sd.idSale
       WHERE s.observation = ?`,
      ["Venta cruzada no permitida"],
    );
    const stock = await querySingleRow<StockQuantityRow>(
      "SELECT quantity FROM stock WHERE idBusiness = ? AND idProduct = ?",
      [scenario.tenantA.business.idBusiness, productA.idProduct],
    );

    expect(saleCount?.total).toBe(0);
    expect(detailCount?.total).toBe(0);
    expect(Number(stock?.quantity)).toBe(10);
  });

  it("aisla listado de compras por negocio", async function test() {
    const productA = await createTenantProduct(scenario.tenantA);
    const productB = await createTenantProduct(scenario.tenantB);
    const supplierA = await createSupplierFixture(scenario.tenantA.business.idBusiness);
    const supplierB = await createSupplierFixture(scenario.tenantB.business.idBusiness);
    const purchaseA = await createPurchaseFixture({
      idBusiness: scenario.tenantA.business.idBusiness,
      idUser: scenario.tenantA.owner.idUser,
      idSupplier: supplierA.idSupplier,
      idProduct: productA.idProduct,
      idDeposit: scenario.tenantA.defaultDeposit.idDeposit,
    });
    const purchaseB = await createPurchaseFixture({
      idBusiness: scenario.tenantB.business.idBusiness,
      idUser: scenario.tenantB.owner.idUser,
      idSupplier: supplierB.idSupplier,
      idProduct: productB.idProduct,
      idDeposit: scenario.tenantB.defaultDeposit.idDeposit,
    });

    const response = await request(getTestApp())
      .get("/api/purchases")
      .set("Cookie", scenario.tenantB.auth.cookies);

    expect(response.status).toBe(200);
    const body = JSON.stringify(extractArrayFromBody(response.body));
    expect(body).toContain(purchaseB.purchaseNumber);
    expect(body).not.toContain(purchaseA.purchaseNumber);
  });

  it("bloquea detalle y anulacion de compra ajena", async function test() {
    const productA = await createTenantProduct(scenario.tenantA);
    const supplierA = await createSupplierFixture(scenario.tenantA.business.idBusiness);
    const purchaseA = await createPurchaseFixture({
      idBusiness: scenario.tenantA.business.idBusiness,
      idUser: scenario.tenantA.owner.idUser,
      idSupplier: supplierA.idSupplier,
      idProduct: productA.idProduct,
      idDeposit: scenario.tenantA.defaultDeposit.idDeposit,
    });

    const detail = await request(getTestApp())
      .get(`/api/purchases/${purchaseA.idPurchase}`)
      .set("Cookie", scenario.tenantB.auth.cookies);
    const cancel = await request(getTestApp())
      .patch(`/api/purchases/${purchaseA.idPurchase}/cancel`)
      .set("Cookie", scenario.tenantB.auth.cookies)
      .send({});

    expectTenantBlocked(detail);
    expectTenantBlocked(cancel);
    expectResponseDoesNotLeak(detail, purchaseA.purchaseNumber);
  });

  it("bloquea compra con proveedor y deposito ajenos sin cabecera ni movimientos", async function test() {
    const productB = await createTenantProduct(scenario.tenantB);
    const supplierA = await createSupplierFixture(scenario.tenantA.business.idBusiness);

    const response = await request(getTestApp())
      .post("/api/purchases")
      .set("Cookie", scenario.tenantB.auth.cookies)
      .send({
        idSupplier: supplierA.idSupplier,
        subtotal: 10,
        discountTotal: 0,
        total: 10,
        observation: "Compra cruzada no permitida",
        details: [
          {
            idProduct: productB.idProduct,
            idDeposit: scenario.tenantA.defaultDeposit.idDeposit,
            quantity: 1,
            unitPrice: 10,
            discountAmount: 0,
            subtotal: 10,
          },
        ],
      });

    expectTenantBlocked(response);
    const purchaseCount = await querySingleRow<CountRow>(
      "SELECT COUNT(*) AS total FROM purchases WHERE observation = ?",
      ["Compra cruzada no permitida"],
    );
    const movementCount = await querySingleRow<CountRow>(
      "SELECT COUNT(*) AS total FROM stock_movements WHERE reference_type = 'PURCHASE' AND idBusiness = ?",
      [scenario.tenantB.business.idBusiness],
    );

    expect(purchaseCount?.total).toBe(0);
    expect(movementCount?.total).toBe(0);
  });
});
