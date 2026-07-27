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

export type PlatformLoginFormValues = z.infer<typeof platformLoginSchema>;
