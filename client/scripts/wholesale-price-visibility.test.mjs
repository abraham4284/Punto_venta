// Render the actual components with local dependencies. No app, API or DB imports.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, statSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const root = fileURLToPath(new URL("../src/", import.meta.url));
const cache = new Map();
const moduleUrl = (path) => {
  if (cache.has(path)) return cache.get(path);
  let source = readFileSync(path, "utf8");
  // SSR has no effects: seed only the two search strings to render the real filtered cards.
  if (path.endsWith("ProductSelectionModal.tsx")) source = source.replaceAll('useState("")', 'useState("Producto")');
  const code = ts.transpileModule(source, { fileName: path, compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText
    .replace(/from ["']([^"']+)["']/g, (_, specifier) => {
      if (!specifier.startsWith("@/") && !specifier.startsWith(".")) return `from ${JSON.stringify(import.meta.resolve(specifier))}`;
      const base = specifier.startsWith("@/") ? resolve(root, specifier.slice(2)) : resolve(dirname(path), specifier);
      const next = [base, `${base}.ts`, `${base}.tsx`, resolve(base, "index.ts")].find((candidate) => existsSync(candidate) && statSync(candidate).isFile());
      assert.ok(next, `Missing local module: ${specifier}`);
      return `from ${JSON.stringify(moduleUrl(next))}`;
    });
  const url = `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`;
  cache.set(path, url); return url;
};
const { ProductSelectionModal } = await import(moduleUrl(resolve(root, "views/businesses-app/module/sales/components/modal/ProductSelectionModal.tsx")));
const { ProductTable } = await import(moduleUrl(resolve(root, "views/businesses-app/module/products/components/table/ProductTable.tsx")));
const product = { idProduct: 1, name: "Producto de prueba", barcode: "PR1", imageUrl: null, priceCost: 1234, priceSale: 15000, priceWholesale: 12000,
  unitType: "UNIT", stockQuantity: 20, stock: 20, stockMin: 1, isActive: true, productCategoryName: "Accesorios", saleMode: "stock" };
const render = (component, props) => renderToStaticMarkup(createElement(component, props));
const modal = (props = {}) => render(ProductSelectionModal, { isOpen: true, products: [product], priceType: "SALE", requireWholesalePrice: false, loading: false, onClose() {}, onConfirm() {}, ...props });
const table = (data = [product]) => render(ProductTable, { data, loading: false, addDataEdit() {}, toggleModal() {}, onOpenGallery() {}, onOpenRichContent() {}, onOpenPricesModal() {}, async toggleProductStatus() { return { status: true }; } });
const clean = (html) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const money = (value) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 }).format(value).replace(/\s+/g, " ");
const prices = (html) => [...html.matchAll(/<dd[^>]*>(.*?)<\/dd>/g)].map((match) => clean(match[1]));

test("modal shows labelled retail and wholesale catalog prices", () => {
  const html = modal(); assert.deepEqual(prices(html), [money(15000), money(12000)]);
  assert.match(clean(html), /Minorista.*Mayorista/);
});
test("retail mode clearly indicates Minorista aplicado", () => assert.match(clean(modal()), /Minorista aplicado/));
test("wholesale mode shows both prices and Mayorista aplicado", () => {
  const html = modal({ priceType: "WHOLESALE", requireWholesalePrice: true });
  assert.deepEqual(prices(html), [money(15000), money(12000)]); assert.match(clean(html), /Mayorista aplicado/);
});
for (const value of [null, undefined, 0, -1, NaN, Infinity]) test(`modal represents invalid/missing wholesale ${value} without zero fallback`, () => {
  const html = modal({ products: [{ ...product, priceWholesale: value }] });
  assert.deepEqual(prices(html), [money(15000), "Sin definir"]); assert.ok(!clean(html).includes(money(0)));
});
test("required wholesale missing price retains disabled quantity and explanatory text", () => {
  const html = modal({ priceType: "WHOLESALE", requireWholesalePrice: true, products: [{ ...product, priceWholesale: null }] });
  assert.match(clean(html), /Sin precio mayorista/); assert.match(html, /<input[^>]*\sdisabled(?:=|\s|>)/); assert.ok(!clean(html).includes("Mayorista aplicado"));
});
test("non-required missing wholesale remains selectable at retail, without claiming wholesale applied", () => {
  const html = modal({ priceType: "WHOLESALE", requireWholesalePrice: false, products: [{ ...product, priceWholesale: null }] });
  assert.match(clean(html), /Minorista aplicado/); assert.ok(!/<input[^>]*\sdisabled(?:=|\s|>)/.test(html));
});
test("product table separates cost, retail and wholesale headers", () => {
  const html = table(); assert.match(clean(html), /Costo Precio minorista Precio mayorista Stock mínimo/); assert.ok(!html.includes("Precio venta"));
});
test("product table renders existing cost and both price values in separate cells", () => {
  const html = table(); const cells = [...html.matchAll(/<td[^>]*>(.*?)<\/td>/g)].map((match) => clean(match[1]));
  assert.deepEqual(cells.slice(6, 9), [money(1234), money(15000), money(12000)]);
});
for (const value of [null, undefined, 0, -1, NaN, Infinity]) test(`product table missing/invalid wholesale ${value} shows dash`, () => {
  const html = table([{ ...product, priceWholesale: value }]); const cells = [...html.matchAll(/<td[^>]*>(.*?)<\/td>/g)].map((match) => clean(match[1]));
  assert.equal(cells[8], "—"); assert.equal(cells[7], money(15000)); assert.equal(cells[6], money(1234));
});
test("table preserves its existing horizontal scroll container", () => assert.match(table(), /data-slot="table-container"[^>]*class="[^"]*overflow-x-auto/));
