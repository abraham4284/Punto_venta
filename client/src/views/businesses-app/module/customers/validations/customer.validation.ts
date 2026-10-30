import { z } from "zod";

export const customerFormSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(120, "El nombre no puede superar los 120 caracteres"),
  lastName: z.string().trim()
    .min(2, "El apellido debe tener al menos 2 caracteres")
    .max(120, "El apellido no puede superar los 120 caracteres"),
  documentType: z.enum(["", "DNI", "CUIL", "CUIT", "PASSPORT", "OTHER"]),
  documentNumber: z.string().trim(),

  phone: z
    .string()
    .trim()
    .max(80, "El teléfono no puede superar los 80 caracteres")
    .optional()
    .or(z.literal("")),

  email: z
    .string()
    .trim()
    .max(160, "El email no puede superar los 160 caracteres")
    .refine((value) => value === "" || z.email().safeParse(value).success, "Email inválido")
    .optional(),

  address: z
    .string()
    .trim()
    .max(255, "La dirección no puede superar los 255 caracteres")
    .optional()
    .or(z.literal("")),

  observation: z
    .string()
    .trim()
    .max(255, "La observación no puede superar los 255 caracteres")
    .optional()
    .or(z.literal("")),
}).strict().superRefine((data, ctx) => {
  const hasType = data.documentType !== "";
  const hasNumber = data.documentNumber !== "";
  if (hasType !== hasNumber) {
    ctx.addIssue({ code: "custom", path: [hasType ? "documentNumber" : "documentType"],
      message: hasType ? "Ingrese el número de documento" : "Seleccione el tipo de documento" });
  }
  if (!hasNumber) return;
  const numeric = ["DNI", "CUIL", "CUIT"].includes(data.documentType);
  const normalized = numeric ? data.documentNumber.replace(/[\s.-]/g, "") : data.documentNumber.toUpperCase();
  if (normalized.length === 0 || normalized.length > 50) {
    ctx.addIssue({ code: "custom", path: ["documentNumber"], message: "El documento debe tener entre 1 y 50 caracteres normalizados" });
  } else if (numeric && !/^\d+$/.test(normalized)) {
    ctx.addIssue({ code: "custom", path: ["documentNumber"], message: "El documento debe contener solo dígitos, puntos, guiones o espacios" });
  }
});

export type CustomerFormSchema = z.infer<typeof customerFormSchema>;
