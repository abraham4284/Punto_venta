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
