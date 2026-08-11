import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import type { RowDataPacket } from "mysql2";
import { getTestApp } from "@/tests/helpers/test-app.helper.js";
import {
  executeMutation,
  querySingleRow,
  resetIntegrationTestData,
} from "@/tests/helpers/test-database.helper.js";
import {
  createTwoTenantScenario,
  type TwoTenantScenario,
} from "@/tests/fixtures/business.fixture.js";
import { createProductCategoryFixture } from "@/tests/fixtures/product-category.fixture.js";
import { createProductFixture } from "@/tests/fixtures/product.fixture.js";
import {
  expectResponseDoesNotLeak,
  expectTenantBlocked,
  extractArrayFromBody,
} from "@/tests/helpers/tenant-assertions.helper.js";

interface ProductStateRow extends RowDataPacket {
  idBusiness: number;
  name: string;
  is_active: number;
}

interface CountRow extends RowDataPacket {
  total: number;
}

interface StockQuantityRow extends RowDataPacket {
  quantity: string;
}

interface ProductListBody {
  data: {
    items: Array<{
      idProduct: number;
      idProductCategory: number;
      name: string;
      barcode: string | null;
      isActive: boolean;
    }>;
    pagination: {
      page: number;
      currentPage: number;
      limit: number;
      total: number;
      totalRecords: number;
      totalPages: number;
    };
  };
}

describe("multi-tenant products and categories", function suite() {
  let scenario: TwoTenantScenario;

  beforeEach(async function setupScenario() {
    await resetIntegrationTestData();
    scenario = await createTwoTenantScenario();
  });

  it("aisla listados de productos por negocio", async function test() {
    const categoryA = await createProductCategoryFixture(
      scenario.tenantA.business.idBusiness,
      "PRODUCTO_SECRETO_TENANT_A_CAT",
    );
    const categoryB = await createProductCategoryFixture(
      scenario.tenantB.business.idBusiness,
      "PRODUCTO_VISIBLE_TENANT_B_CAT",
    );
    const productA = await createProductFixture({
      idBusiness: scenario.tenantA.business.idBusiness,
      idProductCategory: categoryA.idProductCategory,
      idDeposit: scenario.tenantA.defaultDeposit.idDeposit,
      namePrefix: "PRODUCTO_SECRETO_TENANT_A",
    });
    const productB = await createProductFixture({
      idBusiness: scenario.tenantB.business.idBusiness,
      idProductCategory: categoryB.idProductCategory,
      idDeposit: scenario.tenantB.defaultDeposit.idDeposit,
      namePrefix: "PRODUCTO_VISIBLE_TENANT_B",
    });

    const response = await request(getTestApp())
      .get("/api/products")
      .set("Cookie", scenario.tenantB.auth.cookies);

    expect(response.status).toBe(200);
    const records = extractArrayFromBody(response.body);
    expect(JSON.stringify(records)).toContain(productB.name);
    expect(JSON.stringify(records)).not.toContain(productA.name);
  });

  it("no filtra productos de otro tenant por query string", async function test() {
    const categoryA = await createProductCategoryFixture(
      scenario.tenantA.business.idBusiness,
    );
    const productA = await createProductFixture({
      idBusiness: scenario.tenantA.business.idBusiness,
      idProductCategory: categoryA.idProductCategory,
      idDeposit: scenario.tenantA.defaultDeposit.idDeposit,
      namePrefix: "PRODUCTO_SECRETO_TENANT_A",
    });

    const response = await request(getTestApp())
      .get(`/api/products?search=${encodeURIComponent(productA.name)}`)
      .set("Cookie", scenario.tenantB.auth.cookies);

    expect(response.status).toBe(200);
    expectResponseDoesNotLeak(response, productA.name);
  });

  it("bloquea detalle de producto ajeno", async function test() {
    const categoryA = await createProductCategoryFixture(
      scenario.tenantA.business.idBusiness,
    );
    const productA = await createProductFixture({
      idBusiness: scenario.tenantA.business.idBusiness,
      idProductCategory: categoryA.idProductCategory,
      idDeposit: scenario.tenantA.defaultDeposit.idDeposit,
    });

    const response = await request(getTestApp())
      .get(`/api/products/${productA.idProduct}`)
      .set("Cookie", scenario.tenantB.auth.cookies);

    expectTenantBlocked(response);
    expectResponseDoesNotLeak(response, productA.name);
  });

  it("bloquea edicion de producto ajeno y conserva la fila original", async function test() {
    const categoryA = await createProductCategoryFixture(
      scenario.tenantA.business.idBusiness,
    );
    const categoryB = await createProductCategoryFixture(
      scenario.tenantB.business.idBusiness,
    );
    const productA = await createProductFixture({
      idBusiness: scenario.tenantA.business.idBusiness,
      idProductCategory: categoryA.idProductCategory,
      idDeposit: scenario.tenantA.defaultDeposit.idDeposit,
      namePrefix: "Producto intacto A",
    });

    const response = await request(getTestApp())
      .put(`/api/products/${productA.idProduct}`)
      .set("Cookie", scenario.tenantB.auth.cookies)
      .send({
        idProductCategory: categoryB.idProductCategory,
        name: "Producto alterado por tenant B",
      });

    expectTenantBlocked(response);
    const state = await querySingleRow<ProductStateRow>(
      "SELECT idBusiness, name, is_active FROM products WHERE idProduct = ?",
      [productA.idProduct],
    );

    expect(state?.idBusiness).toBe(scenario.tenantA.business.idBusiness);
    expect(state?.name).toBe(productA.name);
  });

  it("bloquea cambio de estado de producto ajeno", async function test() {
    const categoryA = await createProductCategoryFixture(
      scenario.tenantA.business.idBusiness,
    );
    const productA = await createProductFixture({
      idBusiness: scenario.tenantA.business.idBusiness,
      idProductCategory: categoryA.idProductCategory,
      idDeposit: scenario.tenantA.defaultDeposit.idDeposit,
    });

    const response = await request(getTestApp())
      .patch(`/api/products/${productA.idProduct}/status`)
      .set("Cookie", scenario.tenantB.auth.cookies)
      .send({ isActive: false });

    expectTenantBlocked(response);
    const state = await querySingleRow<ProductStateRow>(
      "SELECT idBusiness, name, is_active FROM products WHERE idProduct = ?",
      [productA.idProduct],
    );

    expect(state?.is_active).toBe(1);
  });

  it("bloquea crear producto con categoria de otro tenant y no crea cabecera ni stock", async function test() {
    const categoryA = await createProductCategoryFixture(
      scenario.tenantA.business.idBusiness,
      "CATEGORIA_SECRETA_TENANT_A",
    );

    const response = await request(getTestApp())
      .post("/api/products")
      .set("Cookie", scenario.tenantB.auth.cookies)
      .send({
        idBusiness: scenario.tenantA.business.idBusiness,
        idProductCategory: categoryA.idProductCategory,
        idDeposit: scenario.tenantB.defaultDeposit.idDeposit,
        initialStock: 5,
        barcode: "CROSS-CAT-001",
        name: "Producto no debe crearse",
        description: null,
        imageUrl: null,
        priceCost: 10,
        priceSale: 20,
        priceWholesale: null,
        unitType: "UNIT",
        stockMin: 1,
      });

    expectTenantBlocked(response);
    const count = await querySingleRow<CountRow>(
      "SELECT COUNT(*) AS total FROM products WHERE barcode = ? OR name = ?",
      ["CROSS-CAT-001", "Producto no debe crearse"],
    );
    const stockCount = await querySingleRow<CountRow>(
      "SELECT COUNT(*) AS total FROM stock s INNER JOIN products p ON p.idProduct = s.idProduct WHERE p.barcode = ?",
      ["CROSS-CAT-001"],
    );

    expect(count?.total).toBe(0);
    expect(stockCount?.total).toBe(0);
  });

  it("permite crear producto con stock inicial cero y lo vincula al deposito", async function test() {
    const categoryA = await createProductCategoryFixture(
      scenario.tenantA.business.idBusiness,
      "CATEGORIA_STOCK_CERO",
    );

    const response = await request(getTestApp())
      .post("/api/products")
      .set("Cookie", scenario.tenantA.auth.cookies)
      .send({
        idProductCategory: categoryA.idProductCategory,
        idDeposit: scenario.tenantA.defaultDeposit.idDeposit,
        initialStock: 0,
        barcode: "STOCK-CERO-001",
        name: "Producto con stock cero",
        description: "Alta de catalogo sin existencias iniciales",
        imageUrl: null,
        priceCost: 1500,
        priceSale: 2500,
        priceWholesale: null,
        unitType: "UNIT",
        stockMin: 5,
      });

    expect(response.status).toBe(201);

    const productCount = await querySingleRow<CountRow>(
      "SELECT COUNT(*) AS total FROM products WHERE idBusiness = ? AND barcode = ?",
      [scenario.tenantA.business.idBusiness, "STOCK-CERO-001"],
    );
    const stock = await querySingleRow<StockQuantityRow>(
      `SELECT s.quantity
       FROM stock s
       INNER JOIN products p ON p.idProduct = s.idProduct
       WHERE s.idBusiness = ?
         AND s.idDeposit = ?
         AND p.barcode = ?
       LIMIT 1`,
      [
        scenario.tenantA.business.idBusiness,
        scenario.tenantA.defaultDeposit.idDeposit,
        "STOCK-CERO-001",
      ],
    );

    expect(productCount?.total).toBe(1);
    expect(Number(stock?.quantity)).toBe(0);
  });

  it("pagina productos con orden estable y total filtrado por tenant", async function test() {
    const categoryA = await createProductCategoryFixture(
      scenario.tenantA.business.idBusiness,
      "CATEGORIA_PAGINACION_A",
    );
    const categoryB = await createProductCategoryFixture(
      scenario.tenantB.business.idBusiness,
      "CATEGORIA_PAGINACION_B",
    );

    for (let index = 1; index <= 12; index += 1) {
      await createProductFixture({
        idBusiness: scenario.tenantA.business.idBusiness,
        idProductCategory: categoryA.idProductCategory,
        idDeposit: scenario.tenantA.defaultDeposit.idDeposit,
        namePrefix: `A-PAG-${String(index).padStart(2, "0")}`,
      });
    }

    for (let index = 1; index <= 7; index += 1) {
      await createProductFixture({
        idBusiness: scenario.tenantB.business.idBusiness,
        idProductCategory: categoryB.idProductCategory,
        idDeposit: scenario.tenantB.defaultDeposit.idDeposit,
        namePrefix: `B-PAG-${String(index).padStart(2, "0")}`,
      });
    }

    const pageOne = await request(getTestApp())
      .get("/api/products?page=1&limit=5")
      .set("Cookie", scenario.tenantA.auth.cookies);
    const pageTwo = await request(getTestApp())
      .get("/api/products?page=2&limit=5")
      .set("Cookie", scenario.tenantA.auth.cookies);

    expect(pageOne.status).toBe(200);
    expect(pageTwo.status).toBe(200);

    const pageOneBody = pageOne.body as ProductListBody;
    const pageTwoBody = pageTwo.body as ProductListBody;
    const pageOneIds = pageOneBody.data.items.map(function mapProduct(product) {
      return product.idProduct;
    });
    const pageTwoIds = pageTwoBody.data.items.map(function mapProduct(product) {
      return product.idProduct;
    });

    expect(pageOneBody.data.items).toHaveLength(5);
    expect(pageTwoBody.data.items).toHaveLength(5);
    expect(pageOneBody.data.pagination.total).toBe(12);
    expect(pageOneBody.data.pagination.totalRecords).toBe(12);
    expect(pageOneBody.data.pagination.totalPages).toBe(3);
    expect(pageOneIds.some(function existsInPageTwo(idProduct) {
      return pageTwoIds.includes(idProduct);
    })).toBe(false);
    expect(JSON.stringify(pageOneBody.data.items)).not.toContain("B-PAG");
  });

  it("filtra busqueda, categoria y estado antes de paginar", async function test() {
    const categoryKeyboard = await createProductCategoryFixture(
      scenario.tenantA.business.idBusiness,
      "TECLADOS_TEST",
    );
    const categoryMouse = await createProductCategoryFixture(
      scenario.tenantA.business.idBusiness,
      "MOUSE_TEST",
    );

    for (let index = 1; index <= 6; index += 1) {
      await createProductFixture({
        idBusiness: scenario.tenantA.business.idBusiness,
        idProductCategory: categoryKeyboard.idProductCategory,
        idDeposit: scenario.tenantA.defaultDeposit.idDeposit,
        namePrefix: `Teclado gamer ${String(index).padStart(2, "0")}`,
      });
    }

    const inactiveProduct = await createProductFixture({
      idBusiness: scenario.tenantA.business.idBusiness,
      idProductCategory: categoryKeyboard.idProductCategory,
      idDeposit: scenario.tenantA.defaultDeposit.idDeposit,
      namePrefix: "Teclado gamer inactivo",
    });

    await createProductFixture({
      idBusiness: scenario.tenantA.business.idBusiness,
      idProductCategory: categoryMouse.idProductCategory,
      idDeposit: scenario.tenantA.defaultDeposit.idDeposit,
      namePrefix: "Mouse gamer 01",
    });
    await executeMutation(
      "UPDATE products SET is_active = 0 WHERE idProduct = ?",
      [inactiveProduct.idProduct],
    );

    const response = await request(getTestApp())
      .get(
        `/api/products?page=1&limit=3&search=gamer&idProductCategory=${categoryKeyboard.idProductCategory}&isActive=true`,
      )
      .set("Cookie", scenario.tenantA.auth.cookies);

    expect(response.status).toBe(200);

    const body = response.body as ProductListBody;
    expect(body.data.items).toHaveLength(3);
    expect(body.data.pagination.total).toBe(6);
    expect(body.data.pagination.totalPages).toBe(2);
    expect(
      body.data.items.every(function isKeyboardActive(product) {
        return (
          product.idProductCategory === categoryKeyboard.idProductCategory &&
          product.isActive &&
          product.name.includes("Teclado gamer")
        );
      }),
    ).toBe(true);
  });

  it("devuelve pagina vacia cuando la pagina supera el total", async function test() {
    const categoryA = await createProductCategoryFixture(
      scenario.tenantA.business.idBusiness,
      "CATEGORIA_PAGINA_VACIA",
    );

    await createProductFixture({
      idBusiness: scenario.tenantA.business.idBusiness,
      idProductCategory: categoryA.idProductCategory,
      idDeposit: scenario.tenantA.defaultDeposit.idDeposit,
      namePrefix: "Producto pagina vacia",
    });

    const response = await request(getTestApp())
      .get("/api/products?page=5&limit=5")
      .set("Cookie", scenario.tenantA.auth.cookies);

    expect(response.status).toBe(200);

    const body = response.body as ProductListBody;
    expect(body.data.items).toHaveLength(0);
    expect(body.data.pagination.total).toBe(1);
    expect(body.data.pagination.totalPages).toBe(1);
  });

  it("rechaza limites superiores a 100", async function test() {
    const response = await request(getTestApp())
      .get("/api/products?page=1&limit=101")
      .set("Cookie", scenario.tenantA.auth.cookies);

    expect(response.status).toBe(400);
    expect(JSON.stringify(response.body)).toContain("El limite no puede superar 100 registros");
  });
});
