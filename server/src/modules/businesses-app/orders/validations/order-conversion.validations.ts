import { deliveryProviderShape, validateDeliveryProvider, normalizeDeliveryProvider } from "../../deliveries/validations/delivery-provider.validations.js";
import { z } from "zod";
import { createSaleSchema } from "../../sales/validations/sales.validations.js";

// Reuse the economic field limits; identity, items and amounts never come from HTTP.
const delivery = z.object({ ...deliveryProviderShape, scheduledAt: z.coerce.date().optional().nullable(), observation: z.string().trim().max(255).optional().nullable() }).strict().superRefine(validateDeliveryProvider).transform(normalizeDeliveryProvider);
export const orderConversionSchema = z
  .object({
    idCashSession: createSaleSchema.shape.idCashSession,
    payments: createSaleSchema.shape.payments,
    delivery: delivery.optional().nullable(),
  })
  .strict();
export type OrderConversionBody = z.input<typeof orderConversionSchema>;
