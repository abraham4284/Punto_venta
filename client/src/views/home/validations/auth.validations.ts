import { z } from "zod";

export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "El usuario debe tener al menos 3 caracteres"),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "El nombre completo es obligatorio"),
  username: z
    .string()
    .trim()
    .min(3, "El usuario debe tener al menos 3 caracteres")
    .regex(
      /^[a-zA-Z0-9._-]+$/,
      "El usuario solo puede contener letras, numeros, punto, guion y guion bajo",
    ),
  email: z.string().trim().email("Ingresa un correo valido"),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres"),
  businessName: z
    .string()
    .trim()
    .min(2, "El nombre del comercio es obligatorio"),
  businessSlug: z
    .string()
    .trim()
    .min(2, "El identificador del comercio es obligatorio")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Usa solo minusculas, numeros y guiones medios",
    ),
  businessType: z.string().trim().min(1, "Selecciona un rubro"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
