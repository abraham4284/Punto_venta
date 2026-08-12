import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import type { RowDataPacket } from "mysql2";
import { getTestApp } from "@/tests/helpers/test-app.helper.js";
import {
  executeInsert,
  querySingleRow,
  resetIntegrationTestData,
} from "@/tests/helpers/test-database.helper.js";
import { createTwoTenantScenario } from "@/tests/fixtures/business.fixture.js";
import type { TwoTenantScenario } from "@/tests/fixtures/business.fixture.js";
import { createProductCategoryFixture } from "@/tests/fixtures/product-category.fixture.js";
import { createProductFixture } from "@/tests/fixtures/product.fixture.js";

interface StockQuantityRow extends RowDataPacket {
  quantity: string;
}

interface StockMovementCountRow extends RowDataPacket {
  total: number;
}

async function createProductWithoutStock(input: {
  idBusiness: number;
  idProductCategory: number;
  name: string;
}): Promise<number> {
  return executeInsert(
    `INSERT INTO products
      (idBusiness, idProductCategory, barcode, name, description, price_cost, price_sale, price_wholesale, unit_type, stock_min, is_active)
     VALUES (?, ?, ?, ?, ?, 10, 20, NULL, 'UNIT', 1, 1)`,
    [
      input.idBusiness,
      input.idProductCategory,
      null,
      input.name,
      "Producto sin stock inicial para test",
    ],
  );
}

describe("initial stock zero", function suite() {
  let scenario: TwoTenantScenario;

  beforeEach(async function setup() {
    await resetIntegrationTestData();
    scenario = await createTwoTenantScenario();
  });

  it("permite crear relacion producto deposito con cantidad inicial cero", async function test() {
    const category = await createProductCategoryFixture(
      scenario.tenantA.business.idBusiness,
      "STOCK_CERO",
    );
    const idProduct = await createProductWithoutStock({
      idBusiness: scenario.tenantA.business.idBusiness,
      idProductCategory: category.idProductCategory,
      name: "Producto stock cero",
    });

    const response = await request(getTestApp())
      .post("/api/stock")
      .set("Cookie", scenario.tenantA.auth.cookies)
      .send({
        idProduct,
        idDeposit: scenario.tenantA.defaultDeposit.idDeposit,
        quantity: 0,
        observation: "Alta de relacion sin existencias",
      });

    expect(response.status).toBe(201);

    const stock = await querySingleRow<StockQuantityRow>(
      `SELECT quantity
         FROM stock
        WHERE idBusiness = ?
          AND idProduct = ?
          AND idDeposit = ?`,
      [
        scenario.tenantA.business.idBusiness,
        idProduct,
        scenario.tenantA.defaultDeposit.idDeposit,
      ],
    );
    const movements = await querySingleRow<StockMovementCountRow>(
      `SELECT COUNT(*) AS total
         FROM stock_movements
        WHERE idBusiness = ?
          AND idProduct = ?`,
      [scenario.tenantA.business.idBusiness, idProduct],
    );

    expect(stock).not.toBeNull();
    expect(Number(stock?.quantity)).toBe(0);
    expect(movements?.total).toBe(0);
  });

  it("rechaza stock inicial negativo", async function test() {
    const category = await createProductCategoryFixture(
      scenario.tenantA.business.idBusiness,
      "STOCK_NEGATIVO",
    );
    const idProduct = await createProductWithoutStock({
      idBusiness: scenario.tenantA.business.idBusiness,
      idProductCategory: category.idProductCategory,
      name: "Producto stock negativo",
    });

    const response = await request(getTestApp())
      .post("/api/stock")
      .set("Cookie", scenario.tenantA.auth.cookies)
      .send({
        idProduct,
        idDeposit: scenario.tenantA.defaultDeposit.idDeposit,
        quantity: -1,
        observation: "Cantidad negativa invalida",
      });

    expect(response.status).toBe(400);
    expect(JSON.stringify(response.body)).toContain("negativa");
  });

  it("mantiene invalido ajuste de ingreso con cantidad cero", async function test() {
    const category = await createProductCategoryFixture(
      scenario.tenantA.business.idBusiness,
      "AJUSTE_CERO",
    );
    const product = await createProductFixture({
      idBusiness: scenario.tenantA.business.idBusiness,
      idProductCategory: category.idProductCategory,
      idDeposit: scenario.tenantA.defaultDeposit.idDeposit,
      namePrefix: "Producto ajuste cero",
    });

    const response = await request(getTestApp())
      .post("/api/stock-movements/adjust")
      .set("Cookie", scenario.tenantA.auth.cookies)
      .send({
        idProduct: product.idProduct,
        idDeposit: scenario.tenantA.defaultDeposit.idDeposit,
        quantity: 0,
        type: "ADJUSTMENT_IN",
      });

    expect(response.status).toBe(400);
    expect(JSON.stringify(response.body)).toContain("mayor a cero");
  });

  it("mantiene invalido ajuste de egreso con cantidad cero", async function test() {
    const category = await createProductCategoryFixture(
      scenario.tenantA.business.idBusiness,
      "EGRESO_CERO",
    );
    const product = await createProductFixture({
      idBusiness: scenario.tenantA.business.idBusiness,
      idProductCategory: category.idProductCategory,
      idDeposit: scenario.tenantA.defaultDeposit.idDeposit,
      namePrefix: "Producto egreso cero",
    });

    const response = await request(getTestApp())
      .post("/api/stock-movements/adjust")
      .set("Cookie", scenario.tenantA.auth.cookies)
      .send({
        idProduct: product.idProduct,
        idDeposit: scenario.tenantA.defaultDeposit.idDeposit,
        quantity: 0,
        type: "ADJUSTMENT_OUT",
      });

    expect(response.status).toBe(400);
    expect(JSON.stringify(response.body)).toContain("mayor a cero");
  });

  it("mantiene invalida transferencia con cantidad cero", async function test() {
    const category = await createProductCategoryFixture(
      scenario.tenantA.business.idBusiness,
      "TRANSFER_CERO",
    );
    const product = await createProductFixture({
      idBusiness: scenario.tenantA.business.idBusiness,
      idProductCategory: category.idProductCategory,
      idDeposit: scenario.tenantA.defaultDeposit.idDeposit,
      namePrefix: "Producto transfer cero",
    });
    const idDepositTo = await executeInsert(
      `INSERT INTO deposits (idBusiness, name, description, is_default, is_active)
       VALUES (?, ?, ?, 0, 1)`,
      [
        scenario.tenantA.business.idBusiness,
        "Deposito destino transferencia cero",
        "Deposito destino para test",
      ],
    );

    const response = await request(getTestApp())
      .post("/api/stock-movements/transfer")
      .set("Cookie", scenario.tenantA.auth.cookies)
      .send({
        idProduct: product.idProduct,
        idDepositFrom: scenario.tenantA.defaultDeposit.idDeposit,
        idDepositTo,
        quantity: 0,
      });

    expect(response.status).toBe(400);
    expect(JSON.stringify(response.body)).toContain("mayor a cero");
  });
});
