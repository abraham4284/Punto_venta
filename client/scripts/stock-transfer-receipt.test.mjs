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
const compile = (file) => {
  if (modules.has(file)) return modules.get(file);
  const { outputText } = ts.transpileModule(readFileSync(file, "utf8"), {
    fileName: file,
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  });
  const code = outputText.replace(/from ["']([^"']+)["']/g, (_, specifier) => {
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

const { buildStockTransferReceipt, isConfirmedStockTransfer } = await import(compile(resolve(stock, "helpers/stock-transfer-receipt.helper.ts")));
const { getStockTransferFailure } = await import(compile(resolve(stock, "helpers/stock-transfer.helper.ts")));
const { StockTransferReceiptContent } = await import(compile(resolve(stock, "components/transfer/StockTransferReceiptContent.tsx")));
const { formatDate } = await import(compile(resolve(root, "helpers/formatDate.ts")));
const transfer = {
  referenceId: 123, idDepositFrom: 1, idDepositTo: 3, idUser: 8,
  createdAt: "2026-11-11T12:00:00.000Z", observation: "Mercadería\ntrasladada",
  items: [{ idProduct: 14, productName: "Auricular P47", unitType: "UNIT", quantity: 2 },
    { idProduct: 21, productName: "Perfume a granel", unitType: "LITER", quantity: 1.25 }],
  totalQuantity: 3.25, movementCount: 4,
};
const deposits = [{ idDeposit: 3, name: "Local María" }, { idDeposit: 1, name: "Depósito principal" }];
const session = { idUser: 8, name: "Abraham", businessName: "Cajora Pruebas", logoUrl: "/marca.svg" };
const render = (receipt) => renderToStaticMarkup(createElement(StockTransferReceiptContent, { receipt }));

test("builds a snapshot from the backend reference, timestamp and items, with names from session and deposit IDs", () => {
  const source = structuredClone(transfer);
  const receipt = buildStockTransferReceipt(source, deposits, session);
  assert.deepEqual(receipt, {
    referenceId: 123, createdAt: transfer.createdAt, businessName: "Cajora Pruebas", logoUrl: "/marca.svg",
    actorName: "Abraham", originName: "Depósito principal", destinationName: "Local María",
    observation: transfer.observation, items: transfer.items, movementCount: 4,
  });
  source.items[0].quantity = 10;
  assert.equal(receipt.items[0].quantity, 2);
});

test("uses ID fallbacks for absent deposits or mismatched actor and defaults the brand", () => {
  const receipt = buildStockTransferReceipt(transfer, [], { ...session, idUser: 99, businessName: "", logoUrl: null });
  assert.equal(receipt.originName, "Depósito #1");
  assert.equal(receipt.destinationName, "Depósito #3");
  assert.equal(receipt.actorName, "Usuario #8");
  assert.equal(receipt.businessName, "Cajora");
  assert.equal(receipt.logoUrl, null);
});

test("prints only confirmed operational data, mixed units, signatures and the required notice", () => {
  const html = render(buildStockTransferReceipt({
    ...transfer, items: transfer.items.map((item) => ({ ...item, priceCost: "NO_COSTO", priceSale: "NO_PRECIO" })),
  }, deposits, session));
  for (const value of ["Transferencia #123", transfer.createdAt, formatDate(transfer.createdAt), "Cajora Pruebas",
    "/marca.svg", "Depósito principal", "Local María", "Abraham", "Auricular P47", "2 u.", "Perfume a granel", "1,25 l",
    "Mercadería\ntrasladada", "2 productos distintos", "4 movimientos registrados", "Entregado por", "Recibido por",
    "Documento operativo de transferencia interna.", "No válido como factura ni comprobante de pago."]) {
    assert.ok(html.includes(value), value);
  }
  for (const hidden of ["NO_COSTO", "NO_PRECIO", "3,25", "Precio", "Costo"]) assert.ok(!html.includes(hidden), hidden);
});

test("supports 100 rows, escapes observation markup and uses the unit code if unknown", () => {
  const items = Array.from({ length: 100 }, (_, index) => ({
    idProduct: index + 1, productName: `Producto ${index + 1}`, unitType: "FUTURE_UNIT", quantity: 1.25,
  }));
  const html = render(buildStockTransferReceipt({ ...transfer, items, movementCount: 200, observation: "<b>nota</b>" }, deposits, null));
  assert.equal((html.match(/<tr>/g) ?? []).length, 101);
  assert.match(html, /1,25 FUTURE_UNIT/);
  assert.match(html, /&lt;b&gt;nota&lt;\/b&gt;/);
  assert.match(html, /200 movimientos registrados/);
});

test("shows a valid confirmed response and rejects invalid or partial results", () => {
  const body = { status: true, data: transfer };
  assert.equal(isConfirmedStockTransfer(200, body), true);
  for (const status of [0, 400, 409, 500]) assert.equal(isConfirmedStockTransfer(status, body), false);
  assert.equal(isConfirmedStockTransfer(200, { ...body, status: false }), false);
  for (const override of [{ referenceId: -1 }, { referenceId: "123" }, { createdAt: "invalid" },
    { items: [] }, { items: [transfer.items[0]] }, { movementCount: 2 }, { observation: undefined },
    { items: [{ ...transfer.items[0], quantity: 0 }, transfer.items[1]] }]) {
    assert.equal(isConfirmedStockTransfer(200, { ...body, data: { ...transfer, ...override } }), false);
  }
});

test("distinguishes results requiring review from validation or stock revalidation", () => {
  for (const status of [undefined, 500, 502, 200]) {
    const failure = getStockTransferFailure(status, { message: "SQL interno" });
    assert.equal(failure.requiresReview, true);
    assert.equal(failure.requiresRefresh, false);
    assert.doesNotMatch(failure.message, /SQL interno/);
  }
  assert.equal(getStockTransferFailure(400).requiresReview, false);
  const conflict = getStockTransferFailure(409, { code: "STOCK_TRANSFER_CONCURRENT_CHANGE" });
  assert.equal(conflict.requiresReview, false);
  assert.equal(conflict.requiresRefresh, true);
});
