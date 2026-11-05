// Pure frontend helpers and form schema; no app, backend, network or DB imports.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
const source = (file) => readFileSync(new URL(`../src/views/businesses-app/module/${file}`, import.meta.url), "utf8");
const compile = (text) => ts.transpileModule(text, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const url = (text) => `data:text/javascript;base64,${Buffer.from(text).toString("base64")}`;
const deps = (text) => text.replaceAll('from "decimal.js"', `from "${import.meta.resolve("decimal.js")}"`).replaceAll('from "zod"', `from "${import.meta.resolve("zod")}"`);
const h = await import(url(deps(compile(source("sales/helpers/wholesale-pricing.helpers.ts")))));
const businessTypes = url(compile(source("businesses/types/index.ts")));
const form = await import(url(deps(compile(source("businesses/validations/businesses.validations.ts"))).replaceAll('from "../types"', `from "${businessTypes}"`)));
const policy = { wholesaleEnabled: true, wholesaleMinimumAmount: 50000 };
const customer = (pricingTier = "RETAIL") => ({ idCustomer: 1, fullName: "Cliente de prueba", pricingTier, isActive: true, wholesaleSince: pricingTier === "WHOLESALE" ? "2026-01-01T12:00:00Z" : null });
const item = (quantity = 5, priceWholesale = 10000) => ({ idProduct: 1, name: "Producto", priceSale: 15000, priceWholesale, quantity, unitType: "UNIT", stockQuantity: 100, discountPercent: 0, discountAmount: 0, total: 0, subtotalBeforeDiscount: 0, unitPrice: 0 });
const pricing = (items = [item()], client = customer(), business = policy) => h.getWholesalePricing(business, client, items);

for (const tier of ["RETAIL", "WHOLESALE"]) test(`disabled policy always RETAIL for ${tier}`, () => assert.equal(pricing([item()], customer(tier), { ...policy, wholesaleEnabled: false }).effectivePricingType, "RETAIL"));
test("no Customer remains RETAIL even above threshold", () => assert.equal(pricing([item(10)], null).effectivePricingType, "RETAIL"));
for (const [candidate, expected] of [[49999, "RETAIL"], [50000, "WHOLESALE"], [50001, "WHOLESALE"]]) test(`RETAIL candidate ${candidate} maps to ${expected}`, () => {
  const result = pricing([item(1, candidate)]); assert.equal(result.effectivePricingType, expected); assert.equal(result.wholesaleCandidate, candidate); assert.equal(result.qualifiesForPromotion, expected === "WHOLESALE");
});
test("threshold comes from policy, not a fixed amount", () => assert.equal(pricing([item(1)], customer(), { ...policy, wholesaleMinimumAmount: 10000 }).effectivePricingType, "WHOLESALE"));
test("existing WHOLESALE buys below minimum without promotion notice", () => { const result = pricing([item(1)], customer("WHOLESALE")); assert.equal(result.effectivePricingType, "WHOLESALE"); assert.equal(result.qualifiesForPromotion, false); });
test("amountRemaining uses wholesale candidate", () => { const result = pricing([item(2)]); assert.equal(result.wholesaleCandidate, 20000); assert.equal(result.amountRemaining, 30000); });
test("amountRemaining cannot become negative", () => assert.equal(pricing([item(6)]).amountRemaining, 0));
for (const price of [null, 0, -1, NaN, Infinity, undefined]) test(`invalid wholesale price ${price} blocks promotion without fallback`, () => {
  const row = { ...item(), priceWholesale: price }; const result = pricing([row]);
  assert.equal(h.hasWholesalePrice(row), false); assert.equal(result.allItemsHaveWholesalePrice, false); assert.equal(result.effectivePricingType, "RETAIL");
});
test("one missing line prevents entire RETAIL cart promotion", () => assert.equal(pricing([item(10), { ...item(1, null), idProduct: 2 }]).effectivePricingType, "RETAIL"));
test("WHOLESALE Customer with missing price blocks submit and retains all lines", () => {
  const items = [item(), { ...item(1, null), idProduct: 2 }]; const before = structuredClone(items);
  const result = pricing(items, customer("WHOLESALE")); const cart = h.priceSaleCart(items, result.effectivePricingType);
  assert.equal(result.requiresWholesalePrice, true); assert.match(result.blockReason, /sin precio mayorista/);
  assert.equal(cart.length, 2); assert.equal(cart[1].unitPrice, 0); assert.deepEqual(items, before);
});
test("discounts do not reduce candidate or prevent exact-threshold promotion", () => {
  const discounted = { ...item(), discountPercent: 90, discountAmount: 45000, total: 5000 };
  const result = pricing([discounted]); assert.equal(result.effectivePricingType, "WHOLESALE"); assert.equal(result.wholesaleCandidate, 50000);
});
test("shipping and payments cannot influence helper threshold", () => assert.equal(pricing([{ ...item(4), deliveryFee: 10000, paidAmount: 60000 }]).effectivePricingType, "RETAIL"));
test("decimal quantity uses per-line half-up cents", () => {
  const result = pricing([{ ...item(0.15, 0.1), unitType: "KG" }, { ...item(0.15, 0.1), idProduct: 2, unitType: "KG" }], customer(), { ...policy, wholesaleMinimumAmount: 0.04 });
  assert.equal(result.wholesaleCandidate, 0.04); assert.equal(result.effectivePricingType, "WHOLESALE");
});
for (const quantity of [1.1, 1.001, 0, -1, NaN, Infinity]) test(`invalid UNIT quantity ${quantity} blocks submission`, () => assert.ok(pricing([item(quantity)]).blockReason));
test("KG two decimals accepted, three decimals blocked", () => {
  assert.equal(pricing([{ ...item(1.23), unitType: "KG" }]).blockReason, null);
  assert.ok(pricing([{ ...item(1.234), unitType: "KG" }]).blockReason);
});
test("empty cart never promotes a RETAIL customer", () => assert.equal(pricing([]).qualifiesForPromotion, false));
test("policy unavailable fails closed", () => assert.ok(pricing([item()], customer(), null).blockReason));
for (const minimum of [null, 0, -1, NaN, Infinity]) test(`invalid enabled minimum ${minimum} fails closed`, () => assert.ok(pricing([item()], customer(), { ...policy, wholesaleMinimumAmount: minimum }).blockReason));
test("missing selected customer and inactive customer fail closed", () => {
  assert.ok(h.getWholesalePricing(policy, null, [item()], true).blockReason);
  assert.ok(pricing([item()], { ...customer(), isActive: false }).blockReason);
});
test("switch customer RETAIL -> WHOLESALE -> anonymous reprices without losing rows/discounts", () => {
  const items = [{ ...item(1), discountPercent: 10 }];
  for (const [client, expectedPrice, expectedTotal] of [[customer(), 15000, 13500], [customer("WHOLESALE"), 10000, 9000], [null, 15000, 13500]]) {
    const result = pricing(items, client), cart = h.priceSaleCart(items, result.effectivePricingType);
    assert.equal(cart[0].unitPrice, expectedPrice); assert.equal(cart[0].total, expectedTotal); assert.equal(cart.length, 1); assert.equal(cart[0].discountPercent, 10);
  }
});
test("lowering quantity below minimum immediately reprices retail", () => {
  const qualifying = h.priceSaleCart([item(5)], pricing([item(5)]).effectivePricingType);
  const reduced = [{ ...qualifying[0], quantity: 4 }]; const result = pricing(reduced);
  assert.equal(result.effectivePricingType, "RETAIL"); assert.equal(h.priceSaleCart(reduced, result.effectivePricingType)[0].unitPrice, 15000);
});
test("adding a missing-price item to qualifying RETAIL cart returns entire cart to retail", () => {
  const items = [item(5), { ...item(1, null), idProduct: 2 }]; const result = pricing(items);
  assert.equal(result.effectivePricingType, "RETAIL"); assert.deepEqual(h.priceSaleCart(items, result.effectivePricingType).map((i) => i.unitPrice), [15000, 15000]);
});
test("updated catalog prices replace prior computed unitPrice", () => assert.equal(h.priceSaleCart([{ ...item(), unitPrice: 999, priceWholesale: 11000 }], "WHOLESALE")[0].unitPrice, 11000));
test("line rounding and payload/global discount remain arithmetically consistent", () => {
  const cart = h.priceSaleCart([{ ...item(0.15, 0.1), unitType: "KG", discountPercent: 50 }], "WHOLESALE");
  const payload = h.saleItemPayload(cart[0], 50); assert.deepEqual(payload, { idProduct: 1, quantity: 0.15, unitPrice: 0.1, discount: 0.02, total: 0 });
});
for (const [value, label] of [["RETAIL", "Minorista"], ["WHOLESALE", "Mayorista"], [null, "No registrado"]]) test(`historical ${value} maps to ${label}`, () => assert.equal(h.salePricingLabel(value), label));
for (const code of ["WHOLESALE_DISABLED", "WHOLESALE_CUSTOMER_REQUIRED", "WHOLESALE_CUSTOMER_INVALID", "WHOLESALE_CUSTOMER_NOT_FOUND", "WHOLESALE_CUSTOMER_INACTIVE", "WHOLESALE_MINIMUM_NOT_REACHED", "WHOLESALE_PRICE_MISSING", "WHOLESALE_PRICE_MISMATCH", "WHOLESALE_INVALID_QUANTITY"]) test(`${code} uses safe text and requires refresh`, () => { assert.equal(h.salePricingError(code).refresh, true); assert.ok(!h.salePricingError(code).message.includes(code)); });
test("concurrent conflict preserves same-key retry without policy refresh", () => assert.equal(h.salePricingError("SALE_CONCURRENT_CHANGE").refresh, false));
test("unknown code never becomes raw SQL display text", () => assert.equal(h.salePricingError("SELECT secret FROM business"), null));

const validForm = { name: "Empresa", slug: "empresa", logoUrl: null, businessType: "PRODUCTOS", wholesaleEnabled: true, wholesaleMinimumAmount: "50000" };
for (const value of ["", "0", "-1", "NaN", "Infinity", "1e5", "1.001", "999999999999.991", "1000000000000", "1,50"]) test(`settings reject invalid minimum ${value}`, () => assert.equal(form.businessFormSchema.safeParse({ ...validForm, wholesaleMinimumAmount: value }).success, false));
for (const value of ["0.01", "50000", " 50.25 ", "999999999999.99"]) test(`settings accept ${value} as numeric payload`, () => assert.equal(form.businessFormSchema.parse({ ...validForm, wholesaleMinimumAmount: value }).wholesaleMinimumAmount, Number(value)));
test("disabled settings always send enabled/minimum pair with NULL", () => {
  const result = form.businessFormSchema.parse({ ...validForm, wholesaleEnabled: false, wholesaleMinimumAmount: "" });
  assert.equal(result.wholesaleEnabled, false); assert.equal(result.wholesaleMinimumAmount, null);
});
test("settings payload contains no tenant or customer pricing tier", () => assert.deepEqual(Object.keys(form.businessFormSchema.parse(validForm)).sort(), ["businessType", "logoUrl", "name", "slug", "wholesaleEnabled", "wholesaleMinimumAmount"].sort()));
