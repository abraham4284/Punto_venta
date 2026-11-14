import { readFileSync } from "node:fs";
import express from "express";
import type { RequestHandler } from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { query, hasPermission } = vi.hoisted(function mocks() {
  return { query: vi.fn(), hasPermission: vi.fn() };
});

vi.mock("@/db/db.js", function database() {
  return { pool: { query } };
});
vi.mock("@/modules/businesses-app/permissions/services/permissions.service.js", function permissions() {
  return { userHasPermissionService: hasPermission };
});
vi.mock("@/middlewares/requireAuth.js", function auth() {
  const requireAuth: RequestHandler = function authenticate(req, res, next) {
    if (!req.headers.authorization) {
      res.sendStatus(401);
      return;
    }
    req.auth = { context: "BUSINESS" } as typeof req.auth;
    req.user = { idBusiness: 7, idUser: 8, role: "SELLER" };
    next();
  };
  return { requireAuth };
});

import routes from "@/modules/businesses-app/stock/routes/stock.routes.js";
import type { AdvancedStockInventoryRow } from "@/modules/businesses-app/stock/types/index.js";

const app = express().use("/api", routes);
const list = "/api/stock/advanced-search";
const exportData = "/api/stock/export-data";
const categoryOptions = "/api/stock/category-options";
const stockRow: AdvancedStockInventoryRow = {
  idStock: 1, idProduct: 4, productName: "Yerba", categoryName: "Almacen", barcode: "123",
  imageUrl: "https://images.example/yerba.webp", unitType: "UNIT", isActive: 0,
  priceCost: "1200.00", priceSale: "1500.00", idDeposit: 2, depositName: "Principal",
  quantity: "0.00", stockMin: "3.00", alertStatus: "ZERO",
};

function get(path: string) {
  return request(app).get(path).set("Authorization", "seller");
}

beforeEach(function reset() {
  vi.resetAllMocks();
  hasPermission.mockResolvedValue(true);
});

describe("Advanced inventory and export HTTP", function http() {
  it("keeps legacy pagination, count and DTO when categoryIds is absent", async function listLegacy() {
    query.mockResolvedValue([[[stockRow], [{ totalRecords: "35" }]]]);
    const response = await get(list).query({ page: 2, limit: 15 });
    expect(response.status, response.text).toBe(200);
    expect(query).toHaveBeenCalledWith(
      "CALL sp_get_advanced_stock_inventory(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [7, null, null, null, null, null, null, null, 15, 15],
    );
    expect(response.body.data).toEqual({
      stock: [{ ...stockRow, isActive: false, priceCost: 1200, priceSale: 1500, quantity: 0, stockMin: 3 }],
      pagination: { totalRecords: 35, currentPage: 2, totalPages: 3, limit: 15 },
    });
  });

  it.each(["2", "2,5,8", "9007199254740991"])("binds %s the same way for list and export", async function shared(categoryIds) {
    query.mockResolvedValueOnce([[[], [{ totalRecords: 0 }]]]).mockResolvedValueOnce([[[]]]);
    const filters = { search: "  yerba  ", idDeposit: 4, quantity: 1, minQuantity: 0, maxQuantity: 8, alertStatus: "LOW", categoryIds };
    expect((await get(list).query(filters)).status).toBe(200);
    expect((await get(exportData).query(filters)).status).toBe(200);
    const params = [7, "yerba", 4, 1, 0, 8, "LOW", `[${categoryIds}]`];
    expect(query.mock.calls).toEqual([
      ["CALL sp_get_advanced_stock_inventory(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [...params, 15, 0]],
      ["CALL sp_get_stock_inventory_export(?, ?, ?, ?, ?, ?, ?, ?)", params],
    ]);
  });

  it.each([
    "", "2,2", "2, 5", "2\n", "0", "-2", "2.5", "2e1", "02", "null", "2,", "2,,5",
    "9007199254740992", Array.from({ length: 31 }, (_, i) => i + 1).join(","),
  ])("rejects invalid categoryIds %j on both endpoints without reading stock", async function invalid(categoryIds) {
    for (const path of [list, exportData]) {
      const response = await get(path).query({ categoryIds });
      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual([expect.objectContaining({ field: "categoryIds" })]);
    }
    expect(query).not.toHaveBeenCalled();
  });

  it("rejects repeated query keys, tenant overrides, invalid ranges and export paging", async function strict() {
    for (const path of [list, exportData]) {
      expect((await get(`${path}?categoryIds=2&categoryIds=5`)).status).toBe(400);
      expect((await get(path).query({ idBusiness: 19 })).status).toBe(400);
      expect((await get(path).query({ minQuantity: 2, maxQuantity: 1 })).status).toBe(400);
    }
    expect((await get(exportData).query({ page: 1 })).status).toBe(400);
    expect((await get(exportData).query({ limit: 15 })).status).toBe(400);
    expect(query).not.toHaveBeenCalled();
  });

  it("exports all 35 matches, keeping both deposit rows and nullable image URLs", async function fullExport() {
    const rows = Array.from({ length: 35 }, (_, index) => ({ ...stockRow, idStock: index + 1 }));
    rows[1] = { ...rows[1], idDeposit: 3, depositName: "Local", imageUrl: null };
    query.mockResolvedValue([[rows]]);
    const response = await get(exportData);
    expect(response.status, response.text).toBe(200);
    expect(response.body).toMatchObject({ status: true, data: { totalRecords: 35 } });
    expect(response.body.data.stock).toHaveLength(35);
    expect(response.body.data.stock[0]).toEqual({
      idStock: 1, idProduct: 4, productName: "Yerba", categoryName: "Almacen", barcode: "123",
      imageUrl: stockRow.imageUrl, unitType: "UNIT", isActive: false, idDeposit: 2,
      depositName: "Principal", quantity: 0, stockMin: 3, alertStatus: "ZERO",
    });
    expect(response.body.data.stock[1]).toMatchObject({ idProduct: 4, idDeposit: 3, imageUrl: null });
    expect(query).toHaveBeenCalledOnce();
  });

  it.each([0, 2000])("returns all %i rows with an exact total", async function withinCap(totalRecords) {
    query.mockResolvedValue([[Array.from({ length: totalRecords }, () => stockRow)]]);
    const response = await get(exportData);
    expect(response.status).toBe(200);
    expect(response.body.data.totalRecords).toBe(totalRecords);
    expect(response.body.data.stock).toHaveLength(totalRecords);
  });

  it("rejects the whole export if the sentinel row is returned", async function aboveCap() {
    query.mockResolvedValue([[Array.from({ length: 2001 }, () => stockRow)]]);
    const response = await get(exportData);
    expect(response.status).toBe(422);
    expect(response.body).toEqual({
      status: false, code: "STOCK_EXPORT_LIMIT_EXCEEDED",
      message: "Acota los filtros para exportar el inventario.", data: { maxRecords: 2000 },
    });
  });

  it.each([list, exportData, categoryOptions])("requires authenticated stock.view on %s", async function auth(path) {
    expect((await request(app).get(path)).status).toBe(401);
    hasPermission.mockResolvedValue(false);
    expect((await get(path)).status).toBe(403);
    expect(hasPermission).toHaveBeenCalledWith(7, 8, "stock.view");
    expect(query).not.toHaveBeenCalled();
  });

  it("offers category IDs and names scoped to the authenticated stock reader", async function options() {
    const options = [{ idProductCategory: 2, name: "Almacen" }];
    query.mockResolvedValue([options]);
    expect((await get(categoryOptions).query({ idBusiness: 19 })).status).toBe(400);
    const response = await get(categoryOptions);
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(options);
    expect(query).toHaveBeenCalledExactlyOnceWith(
      expect.stringMatching(/SELECT idProductCategory, name\s+FROM product_categories\s+WHERE idBusiness = \?/),
      [7],
    );
  });

  it("keeps database error details out of the response", async function error() {
    query.mockRejectedValue(new Error("internal database error"));
    const response = await get(exportData);
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ status: false, message: "No se pudo consultar el inventario" });
  });
});

describe("Inventory SQL source", function sql() {
  const source = readFileSync(new URL("../../db/procedures/stock.sql", import.meta.url), "utf8");
  const advanced = source.split("CREATE PROCEDURE sp_get_advanced_stock_inventory(")[1].split("END$$")[0];
  const exported = source.split("CREATE PROCEDURE sp_get_stock_inventory_export(")[1].split("END$$")[0];
  const filters = /FROM stock s[\s\S]*?(?=ORDER BY|;)/g;

  it("uses identical joins and predicates in rows, count and export", function parity() {
    const [listFilters = "", countFilters] = advanced.match(filters) ?? [];
    const [exportFilters] = exported.match(filters) ?? [];
    expect(listFilters).toBeTruthy();
    expect(countFilters?.trim()).toBe(listFilters.trim());
    expect(exportFilters?.trim()).toBe(listFilters.trim());
    expect(listFilters).toContain("WHERE s.idBusiness = p_idBusiness");
    for (const join of ["p.idBusiness = s.idBusiness", "d.idBusiness = s.idBusiness", "pc.idBusiness = p.idBusiness"]) {
      expect(listFilters).toContain(join);
    }
    expect(listFilters).toMatch(/p_categoryIds IS NULL\s+OR EXISTS \(\s+SELECT 1\s+FROM JSON_TABLE.+\s+WHERE selected_category.id = pc.idProductCategory/);
    expect(listFilters).not.toMatch(/is_active|GROUP BY|p\.is_active|d\.is_active/);
  });

  it("preserves row grain, alert calculation, image and stable order with bounded export", function projection() {
    const alert = /CASE\s+WHEN s.quantity = 0 THEN 'ZERO'\s+WHEN s.quantity > 0 AND s.quantity <= p.stock_min THEN 'LOW'\s+ELSE 'OK'\s+END AS alertStatus/;
    for (const procedure of [advanced, exported]) {
      expect(procedure).toMatch(alert);
      expect(procedure).toContain("ORDER BY p.name ASC, d.name ASC, s.idStock ASC");
      expect(procedure).toContain("p.image_url AS imageUrl");
      expect(procedure).toContain("s.idStock,");
    }
    expect(advanced).toContain("LIMIT p_limit OFFSET p_offset");
    expect(advanced).toContain("COUNT(*) AS totalRecords");
    expect(exported).toContain("LIMIT 2001;");
    expect(exported).not.toMatch(/priceCost|priceSale|OFFSET/);
  });
});
