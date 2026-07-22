import { z } from "zod";

export const loginSchema = z.object({
  username: z
    .string()
    .min(3, "El usuario debe tener al menos 3 caracteres")
    .max(120, "El usuario no puede superar los 120 caracteres"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export const updatePasswordSchema = z.object({
  password: z
    .string({
      message: "La contrasena es obligatoria",
    })
    .min(5, "La contrasena debe tener al menos 5 caracteres"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio").max(120),

  username: z
    .string()
    .min(3, "El usuario debe tener al menos 3 caracteres")
    .max(120, "El usuario no puede superar los 120 caracteres")
    .regex(
      /^[a-zA-Z0-9._-]+$/,
      "El usuario solo puede contener letras, números, punto, guion y guion bajo"
    ),

  email: z
    .string()
    .email("Email inválido")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value === "" ? null : value)),

  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),

  businessName: z.string().min(2, "El nombre del negocio es obligatorio").max(160),

  businessSlug: z
    .string()
    .min(2, "El slug del negocio es obligatorio")
    .max(180)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug inválido"),

  businessType: z.string().max(100).optional(),

  logoUrl: z
    .string()
    .url({ message: "Ingrese una URL de imagen valida" })
    .optional()
    .or(z.literal(""))
    .transform(function transformLogoUrl(value) {
      return value === "" ? null : value;
    }),
});
