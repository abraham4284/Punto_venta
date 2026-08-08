import { z } from "zod";

const notificationTypeValues = [
  "SUBSCRIPTION_TRIAL_ENDING",
  "SUBSCRIPTION_PAST_DUE",
  "SUBSCRIPTION_GRACE_ENDING",
  "SUBSCRIPTION_SUSPENDED",
  "SUBSCRIPTION_CANCELLED",
  "SUBSCRIPTION_RENEWED",
  "STOCK_CRITICAL",
  "STOCK_OUT",
  "CASH_SESSION_CLOSED_WITH_DIFFERENCE",
  "BUSINESS_USER_CREATED",
  "TEMPORARY_PASSWORD_ASSIGNED",
  "BUSINESS_USER_DEACTIVATED",
] as const;

export const notificationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(15),
  type: z.enum(notificationTypeValues).optional(),
  severity: z.enum(["INFO", "SUCCESS", "WARNING", "ERROR"]).optional(),
  unreadOnly: z.coerce.boolean().optional().default(false),
});

export const notificationIdSchema = z.object({
  idNotification: z.coerce
    .number({ message: "El identificador debe ser valido" })
    .int("El identificador debe ser entero")
    .positive("El identificador debe ser valido"),
});
