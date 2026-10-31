import { z } from "zod";

export interface DeliveryProviderPayload {
  providerType?: "INTERNAL" | "THIRD_PARTY" | null; assignedToUserId?: number | null;
  externalProviderName?: string | null; externalReference?: string | null; externalContactName?: string | null; externalContactPhone?: string | null; externalCost?: number | null;
}
export interface DeliveryProviderInput {
  providerType: "" | "INTERNAL" | "THIRD_PARTY"; assignedToUserId: number | null;
  externalProviderName: string; externalReference: string; externalContactName: string; externalContactPhone: string; externalCost: string;
}
export const emptyDeliveryProvider: DeliveryProviderInput = { providerType: "", assignedToUserId: null, externalProviderName: "", externalReference: "", externalContactName: "", externalContactPhone: "", externalCost: "" };
const text = (max: number) => z.string().trim().max(max).optional().nullable();
export const providerPayloadShape = {
  providerType: z.enum(["INTERNAL", "THIRD_PARTY"]).nullable(), assignedToUserId: z.number().int().positive().nullable(),
  externalProviderName: text(120), externalReference: text(150), externalContactName: text(160), externalContactPhone: text(80), externalCost: z.number().min(0).max(999999999999.99).multipleOf(0.01).optional().nullable(),
};
export const validateProviderPayload = (data: DeliveryProviderPayload, ctx: z.RefinementCtx) => {
  if (data.providerType === "INTERNAL" && !data.assignedToUserId) ctx.addIssue({ code: "custom", path: ["assignedToUserId"], message: "Seleccioná un cadete" });
  if (data.providerType !== "INTERNAL" && data.assignedToUserId != null) ctx.addIssue({ code: "custom", path: ["assignedToUserId"], message: "El servicio externo no usa un usuario Cajora" });
  if (data.providerType !== "THIRD_PARTY") for (const field of ["externalProviderName", "externalReference", "externalContactName", "externalContactPhone", "externalCost"] as const) { if (data[field] != null) ctx.addIssue({ code: "custom", path: [field], message: "Este dato solo corresponde a un servicio tercerizado" }); }
  if (data.providerType === "THIRD_PARTY" && !data.externalProviderName?.trim()) ctx.addIssue({ code: "custom", path: ["externalProviderName"], message: "Ingresá el proveedor" });
};
export const deliveryProviderSchema = z.object(providerPayloadShape).strict().superRefine(validateProviderPayload);
export const deliveryProviderPayload = (value: DeliveryProviderInput): DeliveryProviderPayload => value.providerType === "THIRD_PARTY" ? {
  providerType: "THIRD_PARTY", assignedToUserId: null, externalProviderName: value.externalProviderName.trim(), externalReference: value.externalReference.trim() || null,
  externalContactName: value.externalContactName.trim() || null, externalContactPhone: value.externalContactPhone.trim() || null, externalCost: value.externalCost.trim() ? Number(value.externalCost) : null,
} : { providerType: value.providerType || null, assignedToUserId: value.providerType === "INTERNAL" ? value.assignedToUserId : null };
export const providerLabel = (value: DeliveryProviderPayload & { assignedUserName?: string | null }) => value.providerType === "THIRD_PARTY" ? `Tercerizado · ${value.externalProviderName || "Proveedor no disponible"}` : value.providerType === "INTERNAL" ? `Cadete propio · ${value.assignedUserName || "Cadete asignado"}` : "Sin asignar";
export const providerInputFrom = (value: DeliveryProviderPayload): DeliveryProviderInput => ({ ...emptyDeliveryProvider, providerType: value.providerType || "", assignedToUserId: value.assignedToUserId ?? null, externalProviderName: value.externalProviderName ?? "", externalReference: value.externalReference ?? "", externalContactName: value.externalContactName ?? "", externalContactPhone: value.externalContactPhone ?? "", externalCost: value.externalCost == null ? "" : String(value.externalCost) });
