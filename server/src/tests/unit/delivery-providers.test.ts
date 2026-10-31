import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
const mocks = vi.hoisted(function mocks() { return { query: vi.fn() }; });
vi.mock("@/db/db.js", function db() { return { pool: { query: mocks.query } }; });
import { deliveryProviderShape, normalizeDeliveryProvider, validateDeliveryProvider } from "../../modules/businesses-app/deliveries/validations/delivery-provider.validations.js";
import { deliveryAssignSchema } from "../../modules/businesses-app/deliveries/validations/deliveries.validations.js";
import { createSaleSchema } from "../../modules/businesses-app/sales/validations/sales.validations.js";
import { orderConversionSchema } from "../../modules/businesses-app/orders/validations/order-conversion.validations.js";
import { assignDeliveryService } from "../../modules/businesses-app/deliveries/services/deliveries.service.js";
import { mapDelivery } from "../../modules/businesses-app/deliveries/helpers/delivery.mapper.js";
import { deliveryDomainError } from "../../modules/businesses-app/deliveries/helpers/delivery-errors.helper.js";
import { z } from "zod";
const schema = z.object(deliveryProviderShape).strict().superRefine(validateDeliveryProvider).transform(normalizeDeliveryProvider);
const external = { providerType: "THIRD_PARTY" as const, externalProviderName: "Uber", externalCost: 42.50 };
beforeEach(function reset() { vi.resetAllMocks(); });
describe("F7 delivery providers DB-free", function suite() {
  it.each([{}, { providerType: null }, { providerType: "INTERNAL", assignedToUserId: 5 }, external, { assignedToUserId: 5 }])("admite modelo explicito/legacy seguro %j", function valid(input) { expect(schema.safeParse(input).success).toBe(true); });
  it.each([{ providerType: "INTERNAL" }, { providerType: null, assignedToUserId: 5 }, { providerType: "THIRD_PARTY" }, { ...external, assignedToUserId: 5 }, { ...external, externalProviderName: "  " }, { ...external, externalCost: -1 }, { ...external, externalCost: 1.001 }, { providerType: "INTERNAL", assignedToUserId: 5, externalReference: "x" }, { providerType: null, externalCost: 0 }])("rechaza ambiguedad/costo %j", function invalid(input) { expect(schema.safeParse(input).success).toBe(false); });
  it("null no significa tercero y usuario legacy solo implica INTERNAL", function legacy() { expect(schema.parse({}).providerType).toBeNull(); expect(schema.parse({ assignedToUserId: 2 }).providerType).toBe("INTERNAL"); });
  it("asignar exige proveedor y usa actor/tenant y los seis campos", async function assign() {
    expect(deliveryAssignSchema.safeParse({ idBusiness: 7, idSaleDelivery: 9, idUser: 4, providerType: null }).success).toBe(false);
    mocks.query.mockResolvedValue([[[{ idSaleDelivery: 9, provider_type: "THIRD_PARTY", external_provider_name: "Uber", external_cost: "42.50" }]]]);
    const result = await assignDeliveryService({ idBusiness: 7, idSaleDelivery: 9, idUser: 4, ...external });
    expect(mocks.query).toHaveBeenCalledWith("CALL sp_delivery_assign(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [7, 9, null, 4, "THIRD_PARTY", "Uber", null, null, null, 42.5]);
    expect(result).toMatchObject({ providerType: "THIRD_PARTY", externalProviderName: "Uber", externalCost: 42.5 });
  });
  it.each([null, "INTERNAL", "THIRD_PARTY"] as const)("Sales directo y conversion soportan %s sin sumar externalCost", function contracts(providerType) {
    const provider = providerType === "THIRD_PARTY" ? external : providerType === "INTERNAL" ? { providerType, assignedToUserId: 5 } : { providerType };
    const payments = [{ idPaymentMethod: 8, amount: 10, status: "PENDING" }];
    const input = { idBusiness: 7, idUser: 4, idDeposit: 2, idCashSession: 3, idempotencyKey: "00000000-0000-4000-8000-000000000001", subtotal: 10, discountTotal: 0, total: 10, items: [{ idProduct: 5, quantity: 1, unitPrice: 10, discount: 0, total: 10 }], payments, delivery: { ...provider, recipientName: "Ana", deliveryAddress: "Calle 123" } };
    const sale = createSaleSchema.parse(input); expect(sale.total).toBe(10); expect(sale.delivery?.providerType).toBe(providerType);
    expect(orderConversionSchema.safeParse({ idCashSession: 3, payments, delivery: provider }).success).toBe(true);
  });
  it("mapper expone costo nullable, contactos y proveedor", function mapper() { expect(mapDelivery({ provider_type: "THIRD_PARTY", external_cost: "0.00", external_contact_phone: "0012" } as never)).toMatchObject({ providerType: "THIRD_PARTY", externalCost: 0, externalContactPhone: "0012" }); });
  it.each(["DELIVERY_SALE_REFUND_REQUIRED", "DELIVERED_SALE_RETURN_REQUIRED", "SALE_PAYMENT_ALREADY_SETTLED", "DELIVERY_IN_TRANSIT_CANNOT_BE_CANCELLED", "THIRD_PARTY_PENDING_CASH_PAYMENT_NOT_ALLOWED"])("error %s tiene mensaje profesional", function errors(code) { expect(deliveryDomainError({ sqlMessage: code })?.message).not.toContain(code); expect(deliveryDomainError({ sqlMessage: code })?.message).toBeTruthy(); });
  it("SQL mantiene estados/tenant, audita reasignacion y bloquea efectivo externo", function sql() {
    const source = readFileSync("src/db/procedures/deliveries.sql", "utf8");
    expect(source).toContain("bu.idBusiness = p_idBusiness AND bu.idUser = p_assignedToUserId AND bu.role = 'DELIVERY'");
    expect(source).toContain("v_previousStatus NOT IN ('PENDING', 'ASSIGNED')");
    expect(source).toContain("'previousAssignment', JSON_EXTRACT(v_previousProvider, '$')");
    expect(source).toContain("'THIRD_PARTY_PENDING_CASH_PAYMENT_NOT_ALLOWED'");
    expect(source).toContain("AND sp.status = 'PENDING' AND pm.affects_cash = 1");
    expect(source).toContain("v_providerType <> 'INTERNAL'");
    const migration = readFileSync("src/db/manual/005_delivery_providers.sql", "utf8");
    expect(migration).toContain("SET provider_type = 'INTERNAL' WHERE provider_type IS NULL AND assigned_to_user_id IS NOT NULL");
    expect(migration).not.toContain("SET provider_type = 'THIRD_PARTY'");
    expect(migration).not.toMatch(/INSERT INTO (?:cash_movements|cash_settlements|users)/i);
  });
  it("anulacion lockea pagos/rendiciones, estados seguros, transaccion y evento sin reabrir Order", function cancellation() {
    const source = readFileSync("src/db/procedures/sales.sql", "utf8").split("CREATE PROCEDURE sp_cancel_sale_and_revert_stock")[1].split("DROP PROCEDURE")[0];
    expect(source).toContain("START TRANSACTION"); expect(source).toContain("COMMIT"); expect(source).toContain("ROLLBACK");
    expect(source).toContain("v_deliveryStatus NOT IN ('PENDING','ASSIGNED','FAILED')");
    expect(source).toContain("ORDER BY idSalePayment FOR UPDATE");
    expect(source).toContain("v_settlement IS NOT NULL"); expect(source).toContain("'SALE_PAYMENT_ALREADY_SETTLED'");
    expect(source).toContain("v_paymentStatus IN ('COLLECTED','CONFIRMED')"); expect(source).toContain("'DELIVERY_SALE_REFUND_REQUIRED'");
    expect(source).toContain("'DELIVERY_IN_TRANSIT_CANNOT_BE_CANCELLED'"); expect(source).toContain("'DELIVERED_SALE_RETURN_REQUIRED'");
    expect(source).not.toMatch(/UPDATE orders|UPDATE cash_settlements/);
  });
});
