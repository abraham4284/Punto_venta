import { z } from "zod";
const id = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const money = z.number().finite().min(0).max(999999999999.99).multipleOf(0.01);
const text = z.string().trim().max(500).nullable().optional();
export const saleReturnIdSchema = z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER);
export const saleReturnBodySchema = z.object({
    reason: z.string().trim().min(3).max(500), observation: text,
    deliveryFeeRefund: money.default(0), idCashSession: id.nullable().optional(),
    items: z.array(z.object({ idSaleDetail: id, quantity: z.number().finite().positive().max(999999999).multipleOf(0.01), restock: z.boolean() }).strict()).max(100),
    refunds: z.array(z.object({ idSalePayment: id, amount: money.positive(), reference: z.string().trim().max(150).nullable().optional(), observation: text }).strict()).max(5),
}).strict().superRefine(function validate(body, ctx) {
    if (!body.items.length && body.deliveryFeeRefund === 0)
        ctx.addIssue({ code: "custom", path: ["items"], message: "Indique productos o un reembolso de envio" });
    for (const [key, values] of [["items", body.items.map(function item(i) { return i.idSaleDetail; })], ["refunds", body.refunds.map(function refund(r) { return r.idSalePayment; })]] as const) {
        if (new Set(values).size !== values.length)
            ctx.addIssue({ code: "custom", path: [key], message: "No se permiten IDs duplicados" });
    }
});
export type SaleReturnBody = z.infer<typeof saleReturnBodySchema>;
