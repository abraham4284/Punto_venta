import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../src/views/businesses-app/module/stock/helpers/stock-transfer.helper.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const h = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);

const product = (idProduct = 14, overrides = {}) => ({
  idProduct, productName: "Producto", unitType: "UNIT", quantity: 5, isActive: true, idDeposit: 1, ...overrides,
});
const line = (quantity = "2", item = product()) => ({ product: item, quantity });

for (const [from, to] of [[1, 1], [0, 3], [1, 0]]) {
  test(`rejects route ${from} to ${to}`, () => assert.equal(h.buildStockTransferPayload(from, to, "", [line()]), null));
}

test("rejects an empty cart and observations above 255 characters", () => {
  assert.equal(h.buildStockTransferPayload(1, 3, "", []), null);
  assert.equal(h.buildStockTransferPayload(1, 3, "a".repeat(256), [line()]), null);
  assert.ok(h.buildStockTransferPayload(1, 3, "a".repeat(255), [line()]));
});

test("duplicate products never add a line and are rejected in payload construction", () => {
  const items = [line()];
  assert.equal(h.addTransferLine(items, product(), 1), items);
  assert.equal(h.buildStockTransferPayload(1, 3, "", [...items, line()]), null);
});

test("adds the 100th distinct product and blocks the 101st", () => {
  const first = Array.from({ length: 99 }, (_, index) => line("1", product(index + 1)));
  const full = h.addTransferLine(first, product(100), 1);
  assert.equal(full.length, 100);
  assert.equal(h.addTransferLine(full, product(101), 1), full);
  assert.equal(h.buildStockTransferPayload(1, 3, "", [...full, line("1", product(101))]), null);
});

for (const overrides of [{ isActive: false }, { quantity: 0 }, { idDeposit: 2 }]) {
  test(`filters unavailable product ${JSON.stringify(overrides)}`, () => {
    assert.equal(h.canAddTransferProduct(product(14, overrides), 1), false);
    assert.deepEqual(h.addTransferLine([], product(14, overrides), 1), []);
    assert.equal(h.buildStockTransferPayload(1, 3, "", [line("1", product(14, overrides))]), null);
  });
}

for (const quantity of ["", "0", "-1", "0.5", "1.001", "6", "1e0", "Infinity"]) {
  test(`UNIT rejects ${JSON.stringify(quantity)}`, () => assert.ok(h.getTransferQuantityError(line(quantity))));
}

test("decimal units accept two places within known stock and reject extra precision", () => {
  const kg = product(21, { unitType: "KG", quantity: 2.25 });
  assert.equal(h.getTransferQuantityError(line("2.25", kg)), undefined);
  assert.ok(h.getTransferQuantityError(line("1.234", kg)));
  assert.ok(h.getTransferQuantityError(line("2.26", kg)));
  const [initial] = h.addTransferLine([], product(21, { unitType: "KG", quantity: 0.25 }), 1);
  assert.equal(initial.quantity, "0.01");
});

test("sends only contract fields, preserves cart order and normalizes observations", () => {
  const lines = [line("1.25", product(21, { unitType: "LITER" })), line()];
  assert.deepEqual(h.buildStockTransferPayload(1, 3, "   ", lines), {
    idDepositFrom: 1, idDepositTo: 3, observation: null,
    items: [{ idProduct: 21, quantity: 1.25 }, { idProduct: 14, quantity: 2 }],
  });
  assert.equal(h.buildStockTransferPayload(1, 3, " Envío ", lines).observation, "Envío");
});

test("refresh preserves quantities and blocks reduced or missing stock", () => {
  const lines = [line(), line("1", product(21))];
  const next = h.refreshTransferLines(lines, new Map([[14, product(14, { quantity: 1 })]]));
  assert.deepEqual(next.map(({ product: row, quantity }) => [row.idProduct, quantity, row.quantity]), [[14, "2", 1], [21, "1", 0]]);
  assert.ok(next.every((item) => h.getTransferQuantityError(item)));
  assert.equal(h.buildStockTransferPayload(1, 3, "", next), null);
});

test("409 requires stock refresh rather than confirming a transfer", () => {
  const failure = h.getStockTransferFailure(409, { code: "STOCK_TRANSFER_CONCURRENT_CHANGE" });
  assert.equal(failure.requiresRefresh, true);
  assert.equal(failure.requiresReview, false);
  assert.match(failure.message, /Actualizá los saldos/);
});

test("400 retains field errors, 500 omits internal messages", () => {
  const errors = [{ field: "items.1.quantity", message: "Cantidad inválida" }];
  assert.deepEqual(h.getStockTransferFailure(400, { message: "Stock insuficiente", errors }), {
    message: "Stock insuficiente", errors, requiresRefresh: false, requiresReview: false,
  });
  assert.doesNotMatch(h.getStockTransferFailure(500, { message: "SQL interno" }).message, /SQL interno/);
});
