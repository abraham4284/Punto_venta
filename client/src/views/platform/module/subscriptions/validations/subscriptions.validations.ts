import { z } from "zod";

const nullablePlanLimitSchema = (fieldName: string) =>
  z.preprocess(
    (value) => {
      if (value === "" || value === null || value === undefined) return null;
      return value;
    },
    z.coerce
      .number({ message: `${fieldName} debe ser un numero valido` })
      .int(`${fieldName} debe ser un numero entero`)
      .positive(`${fieldName} debe ser mayor a cero`)
      .nullable(),
  );

export const subscriptionPlanSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "El codigo debe tener al menos 2 caracteres")
    .max(50, "El codigo no puede superar los 50 caracteres")
    .transform((value) => value.toUpperCase()),
  name: z
    .string()
    .trim()
    .min(2, "El nombre es obligatorio")
    .max(100, "El nombre no puede superar los 100 caracteres"),
  description: z.string().trim().max(255).optional(),
  billingPeriod: z.enum(["MONTHLY", "YEARLY"]),
  price: z.coerce.number().positive("El precio debe ser mayor a cero"),
  currency: z
    .string()
    .trim()
    .length(3, "La moneda debe tener 3 caracteres")
    .transform((value) => value.toUpperCase()),
  trialDays: z.coerce.number().int().min(0).max(365),
  maxUsers: nullablePlanLimitSchema("El limite de usuarios"),
  maxProducts: nullablePlanLimitSchema("El limite de productos"),
  maxDeposits: nullablePlanLimitSchema("El limite de depositos"),
  unlimitedUsers: z.boolean(),
  unlimitedProducts: z.boolean(),
  unlimitedDeposits: z.boolean(),
  isActive: z.boolean(),
}).superRefine((data, ctx) => {
  if (!data.unlimitedUsers && data.maxUsers === null) {
    ctx.addIssue({
      code: "custom",
      path: ["maxUsers"],
      message: "Ingrese un limite de usuarios o active ilimitado",
    });
  }

  if (!data.unlimitedProducts && data.maxProducts === null) {
    ctx.addIssue({
      code: "custom",
      path: ["maxProducts"],
      message: "Ingrese un limite de productos o active ilimitado",
    });
  }

  if (!data.unlimitedDeposits && data.maxDeposits === null) {
    ctx.addIssue({
      code: "custom",
      path: ["maxDeposits"],
      message: "Ingrese un limite de depositos o active ilimitado",
    });
  }
});

export const assignSubscriptionSchema = z.object({
  idBusiness: z.coerce.number().int().positive("Seleccione un negocio valido"),
  idSubscriptionPlan: z.coerce.number().int().positive("Seleccione un plan valido"),
  startMode: z.enum(["TRIAL", "ACTIVE"]),
  currentPeriodStart: z.string().optional(),
  currentPeriodEnd: z.string().optional(),
});

export const paymentSchema = z.object({
  idBusinessSubscription: z.coerce
    .number()
    .int()
    .positive("Seleccione una suscripcion valida"),
  amount: z.coerce.number().positive("El importe debe ser mayor a cero"),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  paymentMethod: z.enum(["CASH", "TRANSFER", "MERCADO_PAGO", "CARD", "OTHER"]),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED", "REFUNDED"]),
  paidAt: z.string().optional(),
  periodStart: z.string().min(1, "El inicio del periodo es obligatorio"),
  periodEnd: z.string().min(1, "El fin del periodo es obligatorio"),
  externalReference: z.string().trim().optional(),
  providerPaymentId: z.string().trim().optional(),
  observation: z.string().trim().optional(),
});

export const reasonSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, "El motivo debe tener al menos 5 caracteres")
    .max(500, "El motivo no puede superar los 500 caracteres"),
});

export const cancelReasonSchema = reasonSchema.extend({
  cancelAtPeriodEnd: z.boolean(),
});
