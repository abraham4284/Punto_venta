import XLSX from "xlsx";
import type { RowDataPacket } from "mysql2";
import { beforeEach, describe, expect, it } from "vitest";
import { pool } from "@/db/db.js";
import { confirmProductImportService } from "@/modules/businesses-app/products/services/confirm-product-import.service.js";
import { previewProductImportService } from "@/modules/businesses-app/products/services/preview-product-import.service.js";
import { createOperationalBusinessFixture } from "@/tests/fixtures/business.fixture.js";
import { createDepositFixture } from "@/tests/fixtures/deposit.fixture.js";
import { createProductCategoryFixture } from "@/tests/fixtures/product-category.fixture.js";
import {
  executeInsert,
  querySingleRow,
  resetIntegrationTestData,
} from "@/tests/helpers/test-database.helper.js";

interface ProductCountRow extends RowDataPacket {
  total: number;
}

interface StockQuantityRow extends RowDataPacket {
  quantity: string;
}

interface MovementQuantityRow extends RowDataPacket {
  total: number;
  quantity: string;
}

interface ImportExcelRow {
  barcode?: string;
  name: string;
  categoryName: string;
  depositName: string;
  priceCost?: number;
  priceSale?: number;
  unitType?: string;
  stockMin?: number;
  initialStock: number;
}

function createImportFile(rows: ImportExcelRow[]): Express.Multer.File {
  const worksheet = XLSX.utils.json_to_sheet(rows.map(function mapRow(row) {
    return {
      barcode: row.barcode ?? "",
      name: row.name,
      categoryName: row.categoryName,
      depositName: row.depositName,
      priceCost: row.priceCost ?? 10,
      priceSale: row.priceSale ?? 20,
      unitType: row.unitType ?? "UNIT",
      stockMin: row.stockMin ?? 1,
      initialStock: row.initialStock,
    };
  }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Productos");
  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  }) as Buffer;

  return {
    fieldname: "file",
    originalname: "productos.xlsx",
    encoding: "7bit",
    mimetype: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    size: buffer.length,
    buffer,
    destination: "",
    filename: "",
    path: "",
    stream: null as never,
  };
}

async function createProductWithoutBarcode(input: {
  idBusiness: number;
  idProductCategory: number;
  name: string;
  unitType?: string;
}): Promise<number> {
  return executeInsert(
    `INSERT INTO products
      (idBusiness, idProductCategory, barcode, name, description, price_cost, price_sale, price_wholesale, unit_type, stock_min, is_active)
     VALUES (?, ?, NULL, ?, 'Producto test', 10, 20, NULL, ?, 1, 1)`,
    [
      input.idBusiness,
      input.idProductCategory,
      input.name,
      input.unitType ?? "UNIT",
    ],
  );
}

async function getStockQuantity(input: {
  idBusiness: number;
  idProduct: number;
  idDeposit: number;
}): Promise<number> {
  const row = await querySingleRow<StockQuantityRow>(
    `SELECT quantity
     FROM stock
     WHERE idBusiness = ? AND idProduct = ? AND idDeposit = ?
     LIMIT 1`,
    [input.idBusiness, input.idProduct, input.idDeposit],
  );

  return Number(row?.quantity ?? 0);
}

describe("product import flow", function productImportFlowSuite() {
  beforeEach(async function resetData() {
    await resetIntegrationTestData();
  });

  it("crea producto nuevo sin codigo de barras", async function testCreateProductWithoutBarcode() {
    const tenant = await createOperationalBusinessFixture("import_new");
    const category = await createProductCategoryFixture(tenant.business.idBusiness);
    const file = createImportFile([
      {
        name: "Mouse Logitech",
        categoryName: category.name,
        depositName: `Deposito principal ${tenant.business.slug.split("-").at(-1) ?? ""}`,
        initialStock: 20,
      },
    ]);
    const [depositRows] = await pool.query<RowDataPacket[]>(
      "SELECT name FROM deposits WHERE idBusiness = ? AND idDeposit = ?",
      [tenant.business.idBusiness, tenant.defaultDeposit.idDeposit],
    );
    const depositName = String(depositRows[0].name);
    const preview = await previewProductImportService(
      tenant.business.idBusiness,
      tenant.owner.idUser,
      createImportFile([
        {
          name: "Mouse Logitech",
          categoryName: category.name,
          depositName,
          initialStock: 20,
        },
      ]),
    );

    expect(file.originalname).toBe("productos.xlsx");
    expect(preview.rows[0].action).toBe("CREATE_PRODUCT");

    await confirmProductImportService({
      idBusiness: tenant.business.idBusiness,
      idUser: tenant.owner.idUser,
      importToken: preview.importToken,
      importMode: "CREATE_ONLY",
      existingStockMode: "SKIP_EXISTING_STOCK",
      importValidRowsOnly: true,
    });

    const productCount = await querySingleRow<ProductCountRow>(
      "SELECT COUNT(*) AS total FROM products WHERE idBusiness = ? AND name = ? AND barcode IS NULL",
      [tenant.business.idBusiness, "Mouse Logitech"],
    );

    expect(productCount?.total).toBe(1);
  });

  it("omite por defecto stock existente detectado por nombre normalizado", async function testSkipExistingStockByName() {
    const tenant = await createOperationalBusinessFixture("import_skip");
    const category = await createProductCategoryFixture(tenant.business.idBusiness);
    const depositNameRow = await querySingleRow<RowDataPacket>(
      "SELECT name FROM deposits WHERE idBusiness = ? AND idDeposit = ?",
      [tenant.business.idBusiness, tenant.defaultDeposit.idDeposit],
    );
    const idProduct = await createProductWithoutBarcode({
      idBusiness: tenant.business.idBusiness,
      idProductCategory: category.idProductCategory,
      name: "Mouse Logitech",
    });
    await executeInsert(
      "INSERT INTO stock (idBusiness, idProduct, idDeposit, quantity) VALUES (?, ?, ?, 40)",
      [tenant.business.idBusiness, idProduct, tenant.defaultDeposit.idDeposit],
    );
    const preview = await previewProductImportService(
      tenant.business.idBusiness,
      tenant.owner.idUser,
      createImportFile([
        {
          name: " mouse logitech ",
          categoryName: category.name,
          depositName: String(depositNameRow?.name),
          initialStock: 20,
        },
      ]),
    );

    expect(preview.rows[0].existingProductId).toBe(idProduct);
    expect(preview.rows[0].existingStockQuantity).toBe(40);

    await confirmProductImportService({
      idBusiness: tenant.business.idBusiness,
      idUser: tenant.owner.idUser,
      importToken: preview.importToken,
      importMode: "CREATE_ONLY",
      existingStockMode: "SKIP_EXISTING_STOCK",
      importValidRowsOnly: true,
    });

    await expect(
      getStockQuantity({
        idBusiness: tenant.business.idBusiness,
        idProduct,
        idDeposit: tenant.defaultDeposit.idDeposit,
      }),
    ).resolves.toBe(40);
  });

  it("suma stock existente solo si el usuario elige ADD", async function testAddExistingStock() {
    const tenant = await createOperationalBusinessFixture("import_add");
    const category = await createProductCategoryFixture(tenant.business.idBusiness);
    const depositNameRow = await querySingleRow<RowDataPacket>(
      "SELECT name FROM deposits WHERE idBusiness = ? AND idDeposit = ?",
      [tenant.business.idBusiness, tenant.defaultDeposit.idDeposit],
    );
    const idProduct = await createProductWithoutBarcode({
      idBusiness: tenant.business.idBusiness,
      idProductCategory: category.idProductCategory,
      name: "Mouse Logitech",
    });
    await executeInsert(
      "INSERT INTO stock (idBusiness, idProduct, idDeposit, quantity) VALUES (?, ?, ?, 40)",
      [tenant.business.idBusiness, idProduct, tenant.defaultDeposit.idDeposit],
    );
    const preview = await previewProductImportService(
      tenant.business.idBusiness,
      tenant.owner.idUser,
      createImportFile([
        {
          name: "Mouse Logitech",
          categoryName: category.name,
          depositName: String(depositNameRow?.name),
          initialStock: 20,
        },
      ]),
    );

    await confirmProductImportService({
      idBusiness: tenant.business.idBusiness,
      idUser: tenant.owner.idUser,
      importToken: preview.importToken,
      importMode: "CREATE_ONLY",
      existingStockMode: "ADD_TO_EXISTING_STOCK",
      importValidRowsOnly: true,
    });

    await expect(
      getStockQuantity({
        idBusiness: tenant.business.idBusiness,
        idProduct,
        idDeposit: tenant.defaultDeposit.idDeposit,
      }),
    ).resolves.toBe(60);

    const movement = await querySingleRow<MovementQuantityRow>(
      `SELECT COUNT(*) AS total, COALESCE(SUM(quantity), 0) AS quantity
       FROM stock_movements
       WHERE idBusiness = ? AND idProduct = ? AND movement_type = 'ADJUSTMENT_IN'`,
      [tenant.business.idBusiness, idProduct],
    );

    expect(movement?.total).toBe(1);
    expect(Number(movement?.quantity ?? 0)).toBe(20);
  });

  it("crea stock en deposito nuevo sin crear otro producto", async function testExistingProductNewDeposit() {
    const tenant = await createOperationalBusinessFixture("import_deposit");
    const category = await createProductCategoryFixture(tenant.business.idBusiness);
    const secondaryDeposit = await createDepositFixture(
      tenant.business.idBusiness,
      "Deposito secundario",
    );
    const idProduct = await createProductWithoutBarcode({
      idBusiness: tenant.business.idBusiness,
      idProductCategory: category.idProductCategory,
      name: "Mouse Logitech",
    });
    await executeInsert(
      "INSERT INTO stock (idBusiness, idProduct, idDeposit, quantity) VALUES (?, ?, ?, 40)",
      [tenant.business.idBusiness, idProduct, tenant.defaultDeposit.idDeposit],
    );
    const preview = await previewProductImportService(
      tenant.business.idBusiness,
      tenant.owner.idUser,
      createImportFile([
        {
          name: "Mouse Logitech",
          categoryName: category.name,
          depositName: secondaryDeposit.name,
          initialStock: 20,
        },
      ]),
    );

    expect(preview.rows[0].action).toBe("CREATE_STOCK");

    await confirmProductImportService({
      idBusiness: tenant.business.idBusiness,
      idUser: tenant.owner.idUser,
      importToken: preview.importToken,
      importMode: "CREATE_ONLY",
      existingStockMode: "SKIP_EXISTING_STOCK",
      importValidRowsOnly: true,
    });

    const productCount = await querySingleRow<ProductCountRow>(
      "SELECT COUNT(*) AS total FROM products WHERE idBusiness = ? AND name = ?",
      [tenant.business.idBusiness, "Mouse Logitech"],
    );

    expect(productCount?.total).toBe(1);
    await expect(
      getStockQuantity({
        idBusiness: tenant.business.idBusiness,
        idProduct,
        idDeposit: secondaryDeposit.idDeposit,
      }),
    ).resolves.toBe(20);
  });

  it("marca duplicado interno sin barcode solo cuando coincide nombre y deposito", async function testDuplicateWithoutBarcode() {
    const tenant = await createOperationalBusinessFixture("import_duplicate");
    const category = await createProductCategoryFixture(tenant.business.idBusiness);
    const depositNameRow = await querySingleRow<RowDataPacket>(
      "SELECT name FROM deposits WHERE idBusiness = ? AND idDeposit = ?",
      [tenant.business.idBusiness, tenant.defaultDeposit.idDeposit],
    );
    const preview = await previewProductImportService(
      tenant.business.idBusiness,
      tenant.owner.idUser,
      createImportFile([
        {
          name: "Mouse Logitech",
          categoryName: category.name,
          depositName: String(depositNameRow?.name),
          initialStock: 20,
        },
        {
          name: " mouse logitech ",
          categoryName: category.name,
          depositName: String(depositNameRow?.name),
          initialStock: 10,
        },
      ]),
    );

    expect(preview.duplicateRows).toBe(2);
    expect(preview.rows.every(function everyRow(row) {
      return row.status === "DUPLICATE";
    })).toBe(true);
  });

  it("crea un solo producto nuevo y stock en dos depositos distintos", async function testNewProductTwoDeposits() {
    const tenant = await createOperationalBusinessFixture("import_two_deposits");
    const category = await createProductCategoryFixture(tenant.business.idBusiness);
    const principalDeposit = await querySingleRow<RowDataPacket>(
      "SELECT name FROM deposits WHERE idBusiness = ? AND idDeposit = ?",
      [tenant.business.idBusiness, tenant.defaultDeposit.idDeposit],
    );
    const secondaryDeposit = await createDepositFixture(
      tenant.business.idBusiness,
      "Deposito secundario",
    );
    const preview = await previewProductImportService(
      tenant.business.idBusiness,
      tenant.owner.idUser,
      createImportFile([
        {
          name: "Mouse Logitech",
          categoryName: category.name,
          depositName: String(principalDeposit?.name),
          initialStock: 20,
        },
        {
          name: " mouse logitech ",
          categoryName: category.name,
          depositName: secondaryDeposit.name,
          initialStock: 10,
        },
      ]),
    );

    await confirmProductImportService({
      idBusiness: tenant.business.idBusiness,
      idUser: tenant.owner.idUser,
      importToken: preview.importToken,
      importMode: "CREATE_ONLY",
      existingStockMode: "SKIP_EXISTING_STOCK",
      importValidRowsOnly: true,
    });

    const productCount = await querySingleRow<ProductCountRow>(
      "SELECT COUNT(*) AS total FROM products WHERE idBusiness = ? AND name = ?",
      [tenant.business.idBusiness, "Mouse Logitech"],
    );

    expect(productCount?.total).toBe(1);

    const [stockRows] = await pool.query<RowDataPacket[]>(
      `SELECT s.quantity
       FROM stock s
       INNER JOIN products p ON p.idProduct = s.idProduct AND p.idBusiness = s.idBusiness
       WHERE s.idBusiness = ? AND p.name = ?
       ORDER BY s.quantity DESC`,
      [tenant.business.idBusiness, "Mouse Logitech"],
    );

    expect(stockRows).toHaveLength(2);
    expect(stockRows.map(function mapQuantity(row) {
      return Number(row.quantity);
    })).toEqual([20, 10]);
  });
});
