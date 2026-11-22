import express from "express";
import type { RequestHandler } from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { query, permission } = vi.hoisted(function mocks() { return { query: vi.fn(), permission: vi.fn() }; });
vi.mock("@/db/db.js", function db() { return { pool: { query } }; });
vi.mock("@/modules/businesses-app/permissions/services/permissions.service.js", function permissions() {
  return { userHasPermissionService: permission };
});
vi.mock("@/middlewares/requireAuth.js", function auth() {
  const requireAuth: RequestHandler = function authenticate(req, res, next) {
    if (!req.headers.authorization) { res.sendStatus(401); return; }
    req.auth = { context: "BUSINESS" } as typeof req.auth;
    req.user = { idBusiness: 7, idUser: 8, role: "SELLER" };
    next();
  };
  return { requireAuth };
});
import routes from "@/modules/businesses-app/products/routes/products.routes.js";
const app = express().use("/api", routes);
const path = "/api/products/price-labels";
const row = { idProduct: 3, name: "Auriculares", barcode: null, category_name: "Audio",
  price_sale: "12500.00", price_wholesale: null, is_active: 0, priceCost: "secret" };

beforeEach(function reset() {
  vi.resetAllMocks(); permission.mockResolvedValue(true); query.mockResolvedValue([[row]]);
});
const get = () => request(app).get(path).set("Authorization", "seller");

describe("Product price labels HTTP, DB-free", function suite() {
  it("returns only display fields and tenant-bound deterministic query with sentinel limit", async function all() {
    const response = await get();
    expect(response.status, response.text).toBe(200);
    expect(response.body).toEqual({ status: true, message: "Productos para etiquetas obtenidos correctamente",
      data: { items: [{ idProduct: 3, name: row.name, barcode: null, categoryName: "Audio", priceSale: 12500, priceWholesale: null, isActive: false }], totalRecords: 1 } });
    const [sql, params] = query.mock.calls[0];
    expect(params).toEqual([7, 2001]);
    expect(sql).toContain("pc.idBusiness = p.idBusiness");
    expect(sql).toContain("WHERE p.idBusiness = ?");
    expect(sql).toContain("ORDER BY pc.name ASC, p.name ASC, p.idProduct ASC");
    expect(sql).not.toMatch(/price_cost|stock|supplier|rich_content/);
  });
  it.each([
    [{ search: " perfume " }, [7, "%perfume%", "%perfume%", "%perfume%", 2001]],
    [{ idProductCategory: "3" }, [7, 3, 2001]],
    [{ isActive: "true" }, [7, 1, 2001]],
    [{ isActive: "false" }, [7, 0, 2001]],
    [{ ids: "10,15,10" }, [7, 10, 15, 2001]],
    [{ ids: "10,15", search: "ABC", idProductCategory: "3", isActive: "false" }, [7, "%ABC%", "%ABC%", "%ABC%", 3, 0, 10, 15, 2001]],
  ])("binds valid filters %j", async function valid(filters, params) {
    expect((await get().query(filters)).status).toBe(200);
    expect(query.mock.calls[0][1]).toEqual(params);
    if ("ids" in filters) expect(query.mock.calls[0][0]).toContain("p.idProduct IN (?, ?)");
  });
  it.each([
    { ids: "" }, { ids: "0" }, { ids: "-2" }, { ids: "2.5" }, { ids: "02" }, { ids: "1,,2" },
    { ids: "1, 2" }, { ids: "1 OR 1=1" }, { ids: "9007199254740992" },
    { ids: Array.from({ length: 2001 }, (_, i) => i + 1).join(",") }, { idBusiness: "9" },
    { idProductCategory: "0" }, { idProductCategory: "3.5" }, { isActive: "1" }, { page: "1" },
  ])("rejects invalid filter %j before DB", async function invalid(filters) {
    expect((await get().query(filters)).status).toBe(400);
    expect(query).not.toHaveBeenCalled();
  });
  it("rejects repeated query keys", async function repeated() {
    expect((await request(app).get(path + "?ids=1&ids=2").set("Authorization", "seller")).status).toBe(400);
    expect(query).not.toHaveBeenCalled();
  });
  it.each([0, 2000])("returns a complete set of %i labels", async function bounded(count) {
    query.mockResolvedValue([Array.from({ length: count }, () => ({ ...row, price_wholesale: "10000.00", is_active: 1 }))]);
    const response = await get();
    expect(response.status).toBe(200);
    expect(response.body.data.items).toHaveLength(count);
    expect(response.body.data.totalRecords).toBe(count);
    if (count) expect(response.body.data.items[0]).toMatchObject({ priceWholesale: 10000, isActive: true });
  });
  it("rejects overflow as a whole", async function limit() {
    query.mockResolvedValue([Array.from({ length: 2001 }, () => row)]);
    const response = await get();
    expect(response.status).toBe(422);
    expect(response.body.code).toBe("PRODUCT_PRICE_LABEL_EXPORT_LIMIT_EXCEEDED");
    expect(response.body.data).toEqual({ maxRecords: 2000 });
  });
  it("uses auth and existing products.view permission", async function guards() {
    expect((await request(app).get(path)).status).toBe(401);
    permission.mockResolvedValue(false);
    expect((await get()).status).toBe(403);
    expect(permission).toHaveBeenCalledWith(7, 8, "products.view");
    expect(query).not.toHaveBeenCalled();
  });
  it("hides unexpected database errors", async function failure() {
    query.mockRejectedValue(new Error("private database info"));
    const response = await get();
    expect(response.status).toBe(500);
    expect(response.body.message).not.toContain("private");
  });
});
