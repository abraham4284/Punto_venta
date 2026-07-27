import { z } from "zod";

function nullableTrimmedString(max: number) {
  return z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform(function normalizeString(value) {
      return value === "" ? null : value;
    });
}

function positiveId(field: string) {
  return z.coerce
    .number({ error: `${field} debe ser valido` })
    .int(`${field} debe ser entero`)
    .positive(`${field} debe ser positivo`);
}

function optionalPositiveId(field: string) {
  return z.preprocess(function normalizeOptionalId(value) {
    return value === "" || value === null || value === undefined ? undefined : value;
  }, positiveId(field).optional());
}

const optionalBoolean = z.preprocess(function normalizeBoolean(value) {
  if (value === "" || value === null || value === undefined) return undefined;
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return value;
}, z.boolean().optional());

const optionalDateString = z.preprocess(function normalizeDate(value) {
  return value === "" || value === null || value === undefined ? undefined : value;
}, z.string().datetime("La fecha debe tener formato ISO").optional());

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(15),
});

export const createSubscriptionPlanSchema = z
  .object({
    code: z
      .string({ error: "El codigo es obligatorio" })
      .trim()
      .min(2, "El codigo debe tener al menos 2 caracteres")
      .max(50, "El codigo no puede superar los 50 caracteres")
      .transform(function normalizeCode(value) {
        return value.toUpperCase();
      }),
    name: z
      .string({ error: "El nombre es obligatorio" })
      .trim()
      .min(2, "El nombre debe tener al menos 2 caracteres")
      .max(100, "El nombre no puede superar los 100 caracteres"),
    description: nullableTrimmedString(255),
    billingPeriod: z.enum(["MONTHLY", "YEARLY"], {
      error: "El periodo de facturacion no es valido",
    }),
    price: z.coerce.number().positive("El precio debe ser mayor a cero"),
    currency: z
      .string()
      .trim()
      .length(3, "La moneda debe tener 3 caracteres")
      .default("ARS")
      .transform(function normalizeCurrency(value) {
        return value.toUpperCase();
      }),
    trialDays: z.coerce
      .number()
      .int("Los dias de prueba deben ser enteros")
      .min(0, "Los dias de prueba no pueden ser negativos")
      .max(365, "Los dias de prueba no pueden superar 365")
      .default(30),
    maxUsers: z.coerce.number().int().positive().nullable().optional(),
    maxProducts: z.coerce.number().int().positive().nullable().optional(),
    maxDeposits: z.coerce.number().int().positive().nullable().optional(),
    isActive: z.coerce.boolean().default(true),
  })
  .strict();

export const updateSubscriptionPlanSchema = createSubscriptionPlanSchema
  .omit({ code: true, isActive: true })
  .partial()
  .strict();

export const toggleSubscriptionPlanStatusSchema = z
  .object({
    isActive: z.coerce.boolean({ error: "El estado debe ser valido" }),
  })
  .strict();

export const listPlansQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().optional(),
  billingPeriod: z.enum(["MONTHLY", "YEARLY"]).optional(),
  isActive: optionalBoolean,
});

export const listBusinessSubscriptionsQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().optional(),
  idBusiness: optionalPositiveId("El negocio"),
  idSubscriptionPlan: optionalPositiveId("El plan"),
  status: z
    .enum(["TRIAL", "ACTIVE", "PAST_DUE", "SUSPENDED", "CANCELLED", "EXPIRED"])
    .optional(),
  billingPeriod: z.enum(["MONTHLY", "YEARLY"]).optional(),
  trialEndsBefore: optionalDateString,
  periodEndsBefore: optionalDateString,
});

export const assignSubscriptionSchema = z
  .object({
    idBusiness: positiveId("El negocio"),
    idSubscriptionPlan: positiveId("El plan"),
    startMode: z.enum(["TRIAL", "ACTIVE"], {
      error: "El modo de inicio no es valido",
    }),
    currentPeriodStart: optionalDateString,
    currentPeriodEnd: optionalDateString,
  })
  .superRefine(function validateActivePeriod(data, ctx) {
    if (data.startMode !== "ACTIVE") return;

    if (!data.currentPeriodStart || !data.currentPeriodEnd) {
      ctx.addIssue({
        code: "custom",
        path: ["currentPeriodStart"],
        message: "El periodo es obligatorio para iniciar activa",
      });
      return;
    }

    if (new Date(data.currentPeriodEnd) <= new Date(data.currentPeriodStart)) {
      ctx.addIssue({
        code: "custom",
        path: ["currentPeriodEnd"],
        message: "La fecha final debe ser posterior a la fecha inicial",
      });
    }
  });

export const changeSubscriptionPlanSchema = z
  .object({
    idSubscriptionPlan: positiveId("El plan"),
    effectiveMode: z.enum(["IMMEDIATE", "NEXT_PERIOD"]).default("IMMEDIATE"),
  })
  .refine(function onlyImmediate(data) {
    return data.effectiveMode === "IMMEDIATE";
  }, "Por ahora solo se permite cambio inmediato");

export const subscriptionReasonSchema = z
  .object({
    reason: z
      .string({ error: "El motivo es obligatorio" })
      .trim()
      .min(3, "El motivo debe tener al menos 3 caracteres")
      .max(500, "El motivo no puede superar los 500 caracteres"),
  })
  .strict();

export const cancelSubscriptionSchema = subscriptionReasonSchema.extend({
  cancelAtPeriodEnd: z.coerce.boolean().default(false),
});

export const autoRenewSchema = z
  .object({
    autoRenew: z.coerce.boolean({ error: "El valor de renovacion debe ser valido" }),
  })
  .strict();

export const listPaymentsQuerySchema = paginationQuerySchema.extend({
  idBusinessSubscription: optionalPositiveId("La suscripcion"),
  idBusiness: optionalPositiveId("El negocio"),
  status: z
    .enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED", "REFUNDED"])
    .optional(),
  paymentMethod: z
    .enum(["CASH", "TRANSFER", "MERCADO_PAGO", "CARD", "OTHER"])
    .optional(),
  dateFrom: optionalDateString,
  dateTo: optionalDateString,
});

export const createSubscriptionPaymentSchema = z
  .object({
    idBusinessSubscription: positiveId("La suscripcion"),
    amount: z.coerce.number().positive("El importe debe ser mayor a cero"),
    currency: z
      .string()
      .trim()
      .length(3, "La moneda debe tener 3 caracteres")
      .default("ARS")
      .transform(function normalizeCurrency(value) {
        return value.toUpperCase();
      }),
    paymentMethod: z.enum(["CASH", "TRANSFER", "MERCADO_PAGO", "CARD", "OTHER"], {
      error: "El metodo de pago no es valido",
    }),
    status: z
      .enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED", "REFUNDED"])
      .default("PENDING"),
    paidAt: optionalDateString.nullable(),
    periodStart: z.string().datetime("El inicio del periodo debe tener formato ISO"),
    periodEnd: z.string().datetime("El fin del periodo debe tener formato ISO"),
    externalReference: nullableTrimmedString(150),
    providerPaymentId: nullableTrimmedString(150),
    observation: nullableTrimmedString(500),
  })
  .superRefine(function validatePaymentPeriod(data, ctx) {
    if (!data.periodStart || !data.periodEnd) return;

    if (new Date(data.periodEnd) <= new Date(data.periodStart)) {
      ctx.addIssue({
        code: "custom",
        path: ["periodEnd"],
        message: "El fin del periodo debe ser posterior al inicio",
      });
    }
  });

export const updatePaymentStatusSchema = z
  .object({
    observation: nullableTrimmedString(500),
  })
  .strict();

export const listEventsQuerySchema = paginationQuerySchema.extend({
  idBusinessSubscription: optionalPositiveId("La suscripcion"),
  idBusiness: optionalPositiveId("El negocio"),
  eventType: z
    .enum([
      "TRIAL_STARTED",
      "TRIAL_EXPIRED",
      "PAYMENT_CREATED",
      "PAYMENT_PENDING",
      "PAYMENT_APPROVED",
      "PAYMENT_REJECTED",
      "PAYMENT_CANCELLED",
      "PAYMENT_REFUNDED",
      "SUBSCRIPTION_ACTIVATED",
      "SUBSCRIPTION_RENEWED",
      "SUBSCRIPTION_PAST_DUE",
      "SUBSCRIPTION_SUSPENDED",
      "SUBSCRIPTION_REACTIVATED",
      "SUBSCRIPTION_CANCELLED",
      "SUBSCRIPTION_EXPIRED",
      "PLAN_CHANGED",
      "AUTO_RENEW_ENABLED",
      "AUTO_RENEW_DISABLED",
    ])
    .optional(),
  dateFrom: optionalDateString,
  dateTo: optionalDateString,
});
