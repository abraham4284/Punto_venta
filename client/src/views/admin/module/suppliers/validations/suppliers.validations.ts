import { z } from "zod";

export const supplierFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "El nombre del proveedor debe tener al menos 3 caracteres")
    .max(160, "El nombre del proveedor no puede superar los 160 caracteres"),

  phone: z
    .string()
    .trim()
    .max(80, "El telefono no puede superar los 80 caracteres")
    .optional()
    .or(z.literal("")),

  email: z
    .string()
    .trim()
    .email("Formato de correo electronico invalido")
    .optional()
    .or(z.literal("")),

  address: z
    .string()
    .trim()
    .max(255, "La direccion no puede superar los 255 caracteres")
    .optional()
    .or(z.literal("")),

  observation: z
    .string()
    .trim()
    .max(255, "La observacion no puede superar los 255 caracteres")
    .optional()
    .or(z.literal("")),
});

export type SupplierFormSchema = z.infer<typeof supplierFormSchema>;
