import { z } from "zod";
import { createSaleSchema } from "../../sales/validations/sales.validations.js";

// Reuse the economic field limits; identity, items and amounts never come from HTTP.
const delivery = createSaleSchema.shape.delivery.unwrap().unwrap().pick({
  assignedToUserId: true,
  scheduledAt: true,
  observation: true,
});
export const orderConversionSchema = z
  .object({
    idCashSession: createSaleSchema.shape.idCashSession,
    payments: createSaleSchema.shape.payments,
    delivery: delivery.optional().nullable(),
  })
  .strict();
export type OrderConversionBody = z.infer<typeof orderConversionSchema>;
