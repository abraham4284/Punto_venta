import { z } from "zod";

const text = function text(max: number) { return z.string().trim().max(max).nullable().optional(); };
export const deliveryProviderShape = {
  providerType: z.enum(["INTERNAL", "THIRD_PARTY"]).nullable().optional(),
  assignedToUserId: z.number().int().positive().nullable().optional(),
  externalProviderName: text(120), externalReference: text(150), externalContactName: text(160), externalContactPhone: text(80),
  externalCost: z.number().min(0).max(999999999999.99).multipleOf(0.01).nullable().optional(),
};
export interface DeliveryProvider {
  providerType?: "INTERNAL" | "THIRD_PARTY" | null; assignedToUserId?: number | null;
  externalProviderName?: string | null; externalReference?: string | null; externalContactName?: string | null; externalContactPhone?: string | null; externalCost?: number | null;
}
export function validateDeliveryProvider(data: DeliveryProvider, ctx: z.RefinementCtx) {
  // Legacy callers may omit providerType; only an explicit user implies INTERNAL, never THIRD_PARTY.
  const type = data.providerType === undefined ? (data.assignedToUserId != null ? "INTERNAL" : null) : data.providerType;
  if (type === "INTERNAL" && data.assignedToUserId == null) ctx.addIssue({ code: "custom", path: ["assignedToUserId"], message: "Selecciona un cadete" });
  if (type !== "INTERNAL" && data.assignedToUserId != null) ctx.addIssue({ code: "custom", path: ["assignedToUserId"], message: "Solo un proveedor interno puede tener cadete" });
  if (type === "THIRD_PARTY" && !data.externalProviderName?.trim()) ctx.addIssue({ code: "custom", path: ["externalProviderName"], message: "El proveedor es obligatorio" });
  if (type !== "THIRD_PARTY") {
    for (const field of ["externalProviderName", "externalReference", "externalContactName", "externalContactPhone", "externalCost"] as const) {
      if (data[field] != null) ctx.addIssue({ code: "custom", path: [field], message: "Solo se admiten datos externos para un servicio tercerizado" });
    }
  }
}
export function normalizeDeliveryProvider<T extends DeliveryProvider>(data: T) {
  return { ...data, providerType: data.providerType === undefined ? (data.assignedToUserId != null ? "INTERNAL" as const : null) : data.providerType };
}
