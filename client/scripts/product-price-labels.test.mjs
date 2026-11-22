import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const root = fileURLToPath(new URL("../src/", import.meta.url));
const products = resolve(root, "views/businesses-app/module/products");
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

const { getProductPriceLabelsRequest } = await import(compile(resolve(products, "api/products.api.ts")));
const { ProductPriceLabelsSheets } = await import(compile(resolve(products, "components/price-labels/ProductPriceLabelsPrintDocument.tsx")));
const { priceLabelPages, labelCurrency, togglePriceLabelPage, defaultPriceLabelContent, priceLabelsError } =
  await import(compile(resolve(products, "helpers/product-price-labels.helper.ts")));
const signal = new AbortController().signal;
const item = { idProduct: 1, name: "Auricular", categoryName: "Audio", barcode: "ABC-123", priceSale: 25900,
  priceWholesale: 19900, isActive: true, priceCost: "SECRET_COST" };
const snapshot = { items: [item], businessName: "Negocio", content: defaultPriceLabelContent };
const render = (value) => renderToStaticMarkup(createElement(ProductPriceLabelsSheets, { snapshot: value }));
const { PriceCheckerProductCard } = await import(compile(resolve(root, "components/global/PriceCheckerProductCard.tsx")));

test("labels use two equal price columns and one column when wholesale is unavailable", () => {
  const dual = render(snapshot);
  assert.match(dual, /data-columns="2"/);
  assert.match(dual, /price-label-price price-label-wholesale/);
  assert.match(dual, /<small>MINORISTA<\/small>/);
  assert.match(dual, /<small>MAYORISTA<\/small>/);
  const single = render({ ...snapshot, items: [{ ...item, priceWholesale: null }] });
  assert.match(single, /data-columns="1"/);
  assert.doesNotMatch(single, /price-label-wholesale/);
});

const checkerProduct = {
  ...item, stock: 2, productCategoryName: "Auriculares", imageUrl: null,
};
const renderChecker = (product) => renderToStaticMarkup(createElement(PriceCheckerProductCard, { product }));

test("F8 displays both persisted prices with stock, barcode, category and active state", () => {
  const html = renderChecker(checkerProduct);
  for (const value of ["MINORISTA", "MAYORISTA", labelCurrency(25900), labelCurrency(19900),
    "Stock actual: 2", "ABC-123", "Auriculares", "Activo"]) assert.ok(html.includes(value), value);
  assert.doesNotMatch(html, /SECRET_COST|emerald|,00/);
});

for (const priceWholesale of [null, undefined, 0, -1, NaN, Infinity]) {
  test(`F8 hides unavailable wholesale ${priceWholesale}`, () => {
    const html = renderChecker({ ...checkerProduct, priceWholesale });
    assert.match(html, /MINORISTA/);
    assert.doesNotMatch(html, /MAYORISTA/);
  });
}

test("F8 preserves actual cents and handles an inactive product without an image", () => {
  const html = renderChecker({ ...checkerProduct, isActive: false, priceSale: 10900.25, priceWholesale: 8900.5 });
  assert.ok(html.includes(labelCurrency(10900.25)));
  assert.ok(html.includes(labelCurrency(8900.5)));
  assert.match(html, /Inactivo/);
});

test("requests selected IDs and all filtered products with no screen pagination", async () => {
  const response = await getProductPriceLabelsRequest({ ids: [10, 15, 10] }, signal);
  assert.equal(response.url, "/products/price-labels?ids=10%2C15");
  assert.equal(response.options.signal, signal);
  const filtered = await getProductPriceLabelsRequest({ search: " audio ", idProductCategory: 3, isActive: false, page: 8, limit: 20 }, signal);
  assert.deepEqual([...new URL(filtered.url, "https://example.test").searchParams],
    [["search", "audio"], ["idProductCategory", "3"], ["isActive", "false"]]);
});
test("rejects invalid or excessive selected IDs", () => {
  for (const ids of [[], [0], [-1], [1.2], [Number.MAX_SAFE_INTEGER + 1], Array.from({ length: 2001 }, (_, i) => i + 1)]) {
    assert.throws(() => getProductPriceLabelsRequest({ ids }, signal), RangeError);
  }
});
test("selection survives pages, selecting and clearing only the current page", () => {
  const first = togglePriceLabelPage(new Set(), [1, 2], true);
  const second = togglePriceLabelPage(first, [3, 4], true);
  assert.deepEqual([...togglePriceLabelPage(second, [3, 4], false)], [1, 2]);
  assert.deepEqual([...first], [1, 2]);
  assert.deepEqual([...togglePriceLabelPage(second, [1], false)], [2, 3, 4]);
});
for (const count of [1, 2, 3, 20, 21, 22, 42, 43, 100, 2000]) {
  test(`paginates ${count} labels in groups of 21 with no loss or duplicates`, () => {
    const items = Array.from({ length: count }, (_, i) => ({ ...item, idProduct: i + 1 }));
    const pages = priceLabelPages(items);
    assert.equal(pages.length, Math.ceil(count / 21));
    assert.deepEqual(pages.flat(), items);
    assert.ok(pages.every(page => page.length <= 21));
  });
}
for (const priceWholesale of [null, 0, -10, NaN, Infinity]) {
  test(`hides invalid wholesale block ${priceWholesale}`, () => {
    assert.doesNotMatch(render({ ...snapshot, items: [{ ...item, priceWholesale }] }), /MAYORISTA/);
  });
}
test("renders persisted public-facing prices and brand, keeping costs out", () => {
  const html = render(snapshot);
  for (const value of [labelCurrency(25900), labelCurrency(19900), "Negocio", "Auricular", "MAYORISTA"]) assert.ok(html.includes(value), value);
  assert.doesNotMatch(html, /SECRET_COST|ABC-123|Audio/);
});
test("toggles barcode and category, marks inactive products and escapes names", () => {
  const html = render({ ...snapshot, items: [{ ...item, name: "<script>alert(1)</script>", isActive: false }],
    content: { ...snapshot.content, barcode: true, category: true, wholesale: false } });
  assert.match(html, /ABC-123/); assert.match(html, /Audio/); assert.match(html, /INACTIVO/);
  assert.doesNotMatch(html, /MAYORISTA|<script>/);
  const hidden = render({ ...snapshot, content: { name: false, retail: false, wholesale: false, barcode: false, category: false } });
  assert.doesNotMatch(hidden, /Auricular|PRECIO MINORISTA|MAYORISTA/);
});
for (const amount of [990, 12500, 125900, 1250000, 12500000]) {
  test(`formats ARS ${amount} without unnecessary decimal digits`, () => {
    assert.doesNotMatch(labelCurrency(amount), /,00/);
    assert.match(render({ ...snapshot, items: [{ ...item, priceSale: amount, name: "X".repeat(160) }] }), /price-label-name/);
  });
}
for (const status of [400, 401, 403, 422, 500]) {
  test(`safe recoverable text for HTTP ${status}`, () => {
    const message = priceLabelsError({ isAxiosError: true, response: { status, data: { message: "SQL SECRET" } } });
    assert.doesNotMatch(message, /SQL SECRET/); assert.ok(message.length);
    if (status === 422) assert.match(message, /2\.000/);
  });
}

