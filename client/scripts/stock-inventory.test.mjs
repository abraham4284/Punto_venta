import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const root = fileURLToPath(new URL("../src/", import.meta.url));
const stock = resolve(root, "views/businesses-app/module/stock");
const modules = new Map();
const axiosStub = `data:text/javascript,${encodeURIComponent("export default { get: (url, options) => Promise.resolve({ url, options }) };")}`;
const compile = (file) => {
  if (modules.has(file)) return modules.get(file);
  const { outputText } = ts.transpileModule(readFileSync(file, "utf8"), {
    fileName: file,
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  });
  const code = outputText.replace(/^import ".+\.css";$/gm, "").replace(/from ["']([^"']+)["']/g, (_, specifier) => {
    if (specifier === "@/api/axios.config") return `from ${JSON.stringify(axiosStub)}`;
    if (!specifier.startsWith("@/") && !specifier.startsWith(".")) return `from ${JSON.stringify(import.meta.resolve(specifier))}`;
    const base = specifier.startsWith("@/") ? resolve(root, specifier.slice(2)) : resolve(dirname(file), specifier);
    const dependency = [base, `${base}.ts`, `${base}.tsx`].find((path) => existsSync(path) && statSync(path).isFile());
    assert.ok(dependency, specifier);
    return `from ${JSON.stringify(compile(dependency))}`;
  });
  const url = `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`;
  modules.set(file, url);
  return url;
};

const api = await import(compile(resolve(stock, "api/stock.api.ts")));
const { StockInventorySheet } = await import(compile(resolve(stock, "components/inventory/StockInventoryPrintDocument.tsx")));
const { prepareInventoryImages, isCompleteInventoryExport, inventoryExportError } =
  await import(compile(resolve(stock, "helpers/stock-inventory.helper.ts")));
const signal = new AbortController().signal;
const filters = { search: " yerba ", idDeposit: 4, quantity: 0, minQuantity: 0, maxQuantity: 10, alertStatus: "ZERO" };

test("shares filters and encodes exactly one categoryIds CSV without duplicates", async () => {
  const selected = { ...filters, page: 2, limit: 15, categoryIds: [2, 5, 2, 8] };
  const list = await api.getAdvancedStockInventoryRequest(selected);
  const exported = await api.getStockInventoryExportRequest(selected, signal);
  const params = new URL(exported.url, "https://example.test").searchParams;
  assert.deepEqual([...params], [
    ["search", "yerba"], ["idDeposit", "4"], ["quantity", "0"], ["minQuantity", "0"],
    ["maxQuantity", "10"], ["alertStatus", "ZERO"], ["categoryIds", "2,5,8"],
  ]);
  assert.deepEqual([...new URL(list.url, "https://example.test").searchParams], [...params, ["page", "2"], ["limit", "15"]]);
  assert.equal(exported.options.signal, signal);
});

test("omits both absent and empty categories and uses the Stock options endpoint", async () => {
  for (const categoryIds of [undefined, []]) {
    const response = await api.getAdvancedStockInventoryRequest({ ...filters, page: 1, limit: 15, categoryIds });
    assert.equal(new URL(response.url, "https://example.test").searchParams.has("categoryIds"), false);
  }
  assert.equal((await api.getStockCategoryOptionsRequest(signal)).url, "/stock/category-options");
});

test("accepts one and thirty safe IDs and rejects invalid or excessive selections", async () => {
  for (const categoryIds of [[2], Array.from({ length: 30 }, (_, index) => index + 1)]) {
    const response = await api.getStockInventoryExportRequest({ ...filters, categoryIds }, signal);
    assert.equal(new URL(response.url, "https://example.test").searchParams.get("categoryIds"), categoryIds.join(","));
  }
  for (const categoryIds of [[0], [-1], [1.5], [Number.MAX_SAFE_INTEGER + 1], Array.from({ length: 31 }, (_, index) => index + 1)]) {
    assert.throws(() => api.getStockInventoryExportRequest({ ...filters, categoryIds }, signal), RangeError);
  }
});

for (const total of [0, 15, 35, 2000, 2001]) {
  test(`validates complete export for ${total} rows`, () => {
    assert.equal(isCompleteInventoryExport({ stock: Array(total).fill({}), totalRecords: total }), total <= 2000);
    assert.equal(isCompleteInventoryExport({ stock: [], totalRecords: total }), total === 0);
  });
}

for (const [status, code, message] of [
  [422, "STOCK_EXPORT_LIMIT_EXCEEDED", /más de 2\.000/],
  [400, null, /Revisá los filtros/], [401, null, /sesión venció/], [403, null, /No tenés permiso/],
  [500, null, /No pudimos/], [undefined, null, /No pudimos/],
]) {
  test(`maps HTTP ${status ?? "network"} to user-safe text`, () => {
    const error = { isAxiosError: true, response: { status, data: { code, message: "private detail" } } };
    const text = inventoryExportError(error);
    assert.match(text, message);
    assert.doesNotMatch(text, /private detail/);
  });
}

const fakeImage = (id, { complete = false, naturalWidth = 0 } = {}) =>
  Object.assign(new EventTarget(), { complete, naturalWidth, dataset: { stockImage: String(id) } });

test("keeps cached and loaded images; uses fallback for errors and timeout", async () => {
  const cached = fakeImage(1, { complete: true, naturalWidth: 30 });
  const broken = fakeImage(2);
  const slow = fakeImage(3);
  const arrives = fakeImage(4);
  const result = prepareInventoryImages([cached, broken, slow, arrives], signal, 10);
  broken.dispatchEvent(new Event("error"));
  arrives.naturalWidth = 50;
  arrives.dispatchEvent(new Event("load"));
  assert.deepEqual([...await result], [1, 4]);
});

test("cancels image preparation without waiting for timeout or accepting late events", async () => {
  const controller = new AbortController();
  const image = fakeImage(1);
  const result = prepareInventoryImages([image], controller.signal);
  controller.abort();
  image.naturalWidth = 50;
  image.dispatchEvent(new Event("load"));
  assert.deepEqual([...await result], []);
});

const row = { idProduct: 12, productName: "Yerba", categoryName: "Almacén", barcode: null, imageUrl: "/yerba.png",
  unitType: "KG", isActive: false, idDeposit: 1, depositName: "Principal", quantity: 0, stockMin: 2,
  alertStatus: "ZERO", priceCost: 11111, priceSale: 99999 };

test("renders 35 stock rows in server order including both deposits, zero, inactive and missing photos", () => {
  const stockRows = Array.from({ length: 35 }, (_, i) => ({ ...row, idStock: i + 1 }));
  stockRows[1] = { ...stockRows[1], idDeposit: 2, depositName: "Local", imageUrl: null, quantity: 1.25 };
  const report = { stock: stockRows, totalRecords: 35, businessName: "Negocio", createdAt: new Date(),
    filters, categoryNames: ["Almacén"], depositName: "Todos", inactiveDepositIds: new Set([2]) };
  const html = renderToStaticMarkup(createElement(StockInventorySheet, { report, loadedImages: new Set([1]) }));
  assert.equal((html.match(/<tr>/g) ?? []).length, 36);
  assert.equal((html.match(/Sin imagen/g) ?? []).length, 34);
  assert.match(html, /Principal[\s\S]+Local/);
  assert.match(html, /Producto inactivo/);
  assert.match(html, /Depósito inactivo/);
  assert.match(html, /1,25 kg/);
  assert.match(html, /0 kg/);
  assert.match(html, /data-stock-image="1"/);
  assert.doesNotMatch(html, /11111|99999|priceCost|priceSale/);
});

