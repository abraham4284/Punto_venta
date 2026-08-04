import { z } from "zod";

export const paymentMethodIdSchema = z
  .object({
    idBusiness: z.number().int().positive("El negocio debe ser valido"),
    idPaymentMethod: z
      .number()
      .int()
      .positive("El metodo de pago debe ser valido"),
  })
  .strict();

export const listPaymentMethodsSchema = z
  .object({
    idBusiness: z.number().int().positive("El negocio debe ser valido"),
    onlyActive: z.boolean(),
  })
  .strict();

export const createPaymentMethodSchema = z
  .object({
    idBusiness: z.number().int().positive("El negocio debe ser valido"),
    idUser: z.number().int().positive("El usuario debe ser valido"),
    code: z.enum(["TRANSFER", "CARD", "OTHER"], {
      error: "El tipo de metodo de pago no es valido",
    }),
    name: z
      .string({ error: "El nombre es obligatorio" })
      .trim()
      .min(2, "El nombre debe tener al menos 2 caracteres")
      .max(80, "El nombre no puede superar los 80 caracteres"),
  })
  .strict();

export const updatePaymentMethodSchema = paymentMethodIdSchema
  .extend({
    name: z
      .string({ error: "El nombre es obligatorio" })
      .trim()
      .min(2, "El nombre debe tener al menos 2 caracteres")
      .max(80, "El nombre no puede superar los 80 caracteres"),
  })
  .strict();

export const changePaymentMethodStatusSchema = paymentMethodIdSchema
  .extend({
    isActive: z.boolean({ error: "El estado es obligatorio" }),
  })
  .strict();
