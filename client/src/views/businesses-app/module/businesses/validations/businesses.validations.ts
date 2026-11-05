import Decimal from "decimal.js";
import { z } from "zod";
import { BUSINESS_TYPE_VALUES } from "../types";

const emptyStringToNull = z.literal("").transform(() => null);

export const businessFormSchema = z
  .object({
    wholesaleEnabled: z.boolean(),
    wholesaleMinimumAmount: z.string().trim(),
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

    businessType: z.enum(BUSINESS_TYPE_VALUES, {
      error: "El tipo de negocio seleccionado no es valido",
    }),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (!data.wholesaleEnabled) return;
    const text = data.wholesaleMinimumAmount;
    if (!/^\d+(?:\.\d{1,2})?$/.test(text) || !new Decimal(text).gt(0) || new Decimal(text).gt("999999999999.99")) {
      ctx.addIssue({ code: "custom", path: ["wholesaleMinimumAmount"], message: "Ingresá un mínimo mayor a cero, hasta 999999999999.99 y con máximo dos decimales." });
    }
  })
  .transform((data) => ({ ...data, wholesaleMinimumAmount: data.wholesaleEnabled ? new Decimal(data.wholesaleMinimumAmount).toNumber() : null }));
