import { z } from "zod";

export const customerFormSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(160, "El nombre no puede superar los 160 caracteres"),

  phone: z
    .string()
    .max(80, "El teléfono no puede superar los 80 caracteres")
    .optional()
    .or(z.literal("")),

  email: z
    .string()
    .email("Email inválido")
    .optional()
    .or(z.literal("")),

  address: z
    .string()
    .max(255, "La dirección no puede superar los 255 caracteres")
    .optional()
    .or(z.literal("")),

  observation: z
    .string()
    .max(255, "La observación no puede superar los 255 caracteres")
    .optional()
    .or(z.literal("")),
});

export type CustomerFormSchema = z.infer<typeof customerFormSchema>;