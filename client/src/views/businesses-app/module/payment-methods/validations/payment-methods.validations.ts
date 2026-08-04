import { z } from "zod";

export const paymentMethodFormSchema = z.object({
  code: z.enum(["TRANSFER", "CARD", "OTHER"], {
    error: "Selecciona un tipo de metodo de pago",
  }),
  name: z
    .string({ error: "El nombre es obligatorio" })
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(80, "El nombre no puede superar los 80 caracteres"),
});
