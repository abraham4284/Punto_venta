import { z } from "zod";

export const platformLoginSchema = z
  .object({
    username: z
      .string({ error: "El usuario es obligatorio" })
      .trim()
      .min(1, "El usuario es obligatorio"),
    password: z
      .string({ error: "La contrasena es obligatoria" })
      .min(1, "La contrasena es obligatoria"),
  })
  .strict();

export const platformBootstrapSchema = z
  .object({
    idUser: z
      .number({ error: "El usuario debe ser valido" })
      .int("El usuario debe ser un entero")
      .positive("El usuario debe ser positivo"),
    role: z.enum(["SUPER_ADMIN", "SUPPORT", "ANALYST"], {
      error: "El rol de plataforma no es valido",
    }),
  })
  .strict();

export const platformBaseUserSchema = z
  .object({
    name: z
      .string({ error: "El nombre es obligatorio" })
      .trim()
      .min(3, "El nombre debe tener al menos 3 caracteres")
      .max(120, "El nombre no puede superar los 120 caracteres"),
    username: z
      .string({ error: "El usuario es obligatorio" })
      .trim()
      .min(3, "El usuario debe tener al menos 3 caracteres")
      .max(120, "El usuario no puede superar los 120 caracteres"),
    email: z
      .string()
      .trim()
      .email("Ingrese un email valido")
      .max(160, "El email no puede superar los 160 caracteres")
      .optional()
      .or(z.literal(""))
      .transform(function transformEmptyEmail(value) {
        return value === "" ? null : value;
      }),
    password: z
      .string({ error: "La contrasena es obligatoria" })
      .min(6, "La contrasena debe tener al menos 6 caracteres")
      .max(72, "La contrasena no puede superar los 72 caracteres"),
  })
  .strict();
