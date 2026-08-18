import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { getTestApp } from "@/tests/helpers/test-app.helper.js";
import {
  executeInsert,
  executeMutation,
  resetIntegrationTestData,
} from "@/tests/helpers/test-database.helper.js";
import {
  createOperationalBusinessFixture,
  createTwoTenantScenario,
} from "@/tests/fixtures/business.fixture.js";
import { createProductCategoryFixture } from "@/tests/fixtures/product-category.fixture.js";
import { createProductFixture } from "@/tests/fixtures/product.fixture.js";

const app = getTestApp();

async function createCriticalProduct(input: {
  idBusiness: number;
  idProductCategory: number;
  idDeposit: number;
  namePrefix: string;
  quantity: number;
  stockMin: number;
}) {
  const product = await createProductFixture({
    idBusiness: input.idBusiness,
    idProductCategory: input.idProductCategory,
    idDeposit: input.idDeposit,
    namePrefix: input.namePrefix,
    quantity: input.quantity,
  });

  await executeMutation("UPDATE products SET stock_min = ? WHERE idProduct = ?", [
    input.stockMin,
    product.idProduct,
  ]);

  return product;
}

describe("critical stock report", function criticalStockReportSuite() {
  beforeEach(async function resetData() {
    await resetIntegrationTestData();
  });

  it("clasifica reposicion por minimo, permite filtros y excluye stock normal", async function criticalStockClassification() {
    const tenant = await createOperationalBusinessFixture("critical_stock");
    const category = await createProductCategoryFixture(
      tenant.business.idBusiness,
      "Criticos",
    );
    const secondDepositId = await executeInsert(
      `INSERT INTO deposits (idBusiness, name, description, is_default, is_active)
       VALUES (?, ?, ?, 0, 1)`,
      [tenant.business.idBusiness, "Deposito secundario", "Fixture"],
    );

    const zero = await createCriticalProduct({
      idBusiness: tenant.business.idBusiness,
      idProductCategory: category.idProductCategory,
      idDeposit: tenant.defaultDeposit.idDeposit,
      namePrefix: "Agotado",
      quantity: 0,
      stockMin: 0,
    });
    const low = await createCriticalProduct({
      idBusiness: tenant.business.idBusiness,
      idProductCategory: category.idProductCategory,
      idDeposit: tenant.defaultDeposit.idDeposit,
      namePrefix: "Bajo",
      quantity: 2,
      stockMin: 10,
    });
    const equal = await createCriticalProduct({
      idBusiness: tenant.business.idBusiness,
      idProductCategory: category.idProductCategory,
      idDeposit: secondDepositId,
      namePrefix: "En-minimo",
      quantity: 5,
      stockMin: 5,
    });
    await createCriticalProduct({
      idBusiness: tenant.business.idBusiness,
      idProductCategory: category.idProductCategory,
      idDeposit: tenant.defaultDeposit.idDeposit,
      namePrefix: "Normal",
      quantity: 20,
      stockMin: 5,
    });

    const response = await request(app)
      .get("/api/stock/report/critical")
      .set("Cookie", tenant.auth.cookies);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(3);
    expect(response.body.data.map((item: { alertStatus: string }) => item.alertStatus)).toEqual([
      "CRITICAL_ZERO",
      "CRITICAL_LOW",
      "CRITICAL_EQUAL",
    ]);
    expect(response.body.data[0]).toMatchObject({
      idProduct: zero.idProduct,
      alertStatus: "CRITICAL_ZERO",
      priceCost: 10,
      unitType: "UNIT",
    });

    const lowResponse = await request(app)
      .get("/api/stock/report/critical?alertStatus=CRITICAL_LOW")
      .set("Cookie", tenant.auth.cookies);

    expect(lowResponse.status).toBe(200);
    expect(lowResponse.body.data).toHaveLength(1);
    expect(lowResponse.body.data[0].idProduct).toBe(low.idProduct);

    const depositResponse = await request(app)
      .get(`/api/stock/report/critical?idDeposit=${secondDepositId}`)
      .set("Cookie", tenant.auth.cookies);

    expect(depositResponse.status).toBe(200);
    expect(depositResponse.body.data).toHaveLength(1);
    expect(depositResponse.body.data[0].idProduct).toBe(equal.idProduct);

    const searchResponse = await request(app)
      .get(`/api/stock/report/critical?search=${encodeURIComponent(low.barcode)}`)
      .set("Cookie", tenant.auth.cookies);

    expect(searchResponse.status).toBe(200);
    expect(searchResponse.body.data).toHaveLength(1);
    expect(searchResponse.body.data[0].idProduct).toBe(low.idProduct);
  });

  it("no expone stock critico de otro tenant", async function criticalStockTenantIsolation() {
    const scenario = await createTwoTenantScenario();
    const categoryA = await createProductCategoryFixture(
      scenario.tenantA.business.idBusiness,
    );
    const categoryB = await createProductCategoryFixture(
      scenario.tenantB.business.idBusiness,
    );

    const productA = await createCriticalProduct({
      idBusiness: scenario.tenantA.business.idBusiness,
      idProductCategory: categoryA.idProductCategory,
      idDeposit: scenario.tenantA.defaultDeposit.idDeposit,
      namePrefix: "Tenant-A",
      quantity: 0,
      stockMin: 10,
    });
    const productB = await createCriticalProduct({
      idBusiness: scenario.tenantB.business.idBusiness,
      idProductCategory: categoryB.idProductCategory,
      idDeposit: scenario.tenantB.defaultDeposit.idDeposit,
      namePrefix: "Tenant-B",
      quantity: 0,
      stockMin: 10,
    });

    const response = await request(app)
      .get("/api/stock/report/critical")
      .set("Cookie", scenario.tenantA.auth.cookies);

    expect(response.status).toBe(200);
    expect(
      response.body.data.some(
        (item: { idProduct: number }) => item.idProduct === productA.idProduct,
      ),
    ).toBe(true);
    expect(
      response.body.data.some(
        (item: { idProduct: number }) => item.idProduct === productB.idProduct,
      ),
    ).toBe(false);
  });
});
