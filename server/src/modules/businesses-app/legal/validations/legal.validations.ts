import { z } from "zod";

export const legalDocumentCodeSchema = z.enum(["TERMS", "PRIVACY"], {
  message: "El documento legal solicitado no es valido",
});

export const legalVersionParamsSchema = z.object({
  code: legalDocumentCodeSchema,
  version: z
    .string()
    .trim()
    .min(1, "La version es obligatoria")
    .max(30, "La version no puede superar los 30 caracteres"),
});

export const legalCodeParamsSchema = z.object({
  code: legalDocumentCodeSchema,
});

export const recordLegalAcceptanceSchema = z.object({
  code: legalDocumentCodeSchema,
  confirmed: z.literal(true, {
    message: "Debe confirmar el documento legal para continuar",
  }),
});
