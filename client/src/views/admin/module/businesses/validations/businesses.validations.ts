import { z } from "zod";

const emptyStringToNull = z.literal("").transform(() => null);

export const businessFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "El nombre debe tener al menos 3 caracteres")
      .max(160, "El nombre no puede superar los 160 caracteres"),

    slug: z
      .string()
      .trim()
      .toLowerCase()
      .min(3, "El slug debe tener al menos 3 caracteres")
      .max(180, "El slug no puede superar los 180 caracteres")
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "El slug solo puede contener letras minusculas, numeros y guiones",
      ),

    logoUrl: z
      .string()
      .trim()
      .url("La URL del logo no es valida")
      .max(500, "La URL del logo no puede superar los 500 caracteres")
      .nullable()
      .or(emptyStringToNull),

    businessType: z.literal("FINANCIERA", {
      error: "El tipo de negocio debe ser FINANCIERA",
    }),
  })
  .strict();
