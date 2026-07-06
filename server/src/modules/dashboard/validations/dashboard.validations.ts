import { z } from "zod";

export const dashboardQuerySchema = z
  .object({
    year: z
      .string()
      .regex(/^\d{4}$/, "El anio debe tener cuatro digitos")
      .transform(function transformYear(value) {
        return Number(value);
      })
      .refine(
        function isSupportedYear(value) {
          return value >= 2000 && value <= 2100;
        },
        {
          message: "El anio debe estar entre 2000 y 2100",
        },
      )
      .optional(),
  })
  .strict();
