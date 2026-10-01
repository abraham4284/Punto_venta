import { z } from "zod";

const MAX_RICH_CONTENT_BYTES = 64 * 1024;

const headingBlockSchema = z
  .object({
    type: z.literal("heading"),
    level: z.union([z.literal(2), z.literal(3)], {
      message: "El nivel del título debe ser H2 o H3",
    }),
    text: z
      .string()
      .trim()
      .min(1, "El título no puede estar vacío")
      .max(150, "El título no puede superar los 150 caracteres"),
  })
  .strict();

const paragraphBlockSchema = z
  .object({
    type: z.literal("paragraph"),
    text: z
      .string()
      .trim()
      .min(1, "El párrafo no puede estar vacío")
      .max(3000, "El párrafo no puede superar los 3000 caracteres"),
  })
  .strict();

const listBlockSchema = z
  .object({
    type: z.literal("list"),
    style: z.union([z.literal("bullet"), z.literal("numbered")], {
      message: "El estilo de lista no es válido",
    }),
    items: z
      .array(
        z
          .string()
          .trim()
          .min(1, "Los ítems de la lista no pueden estar vacíos")
          .max(500, "Cada ítem de lista no puede superar los 500 caracteres"),
      )
      .min(1, "La lista debe tener al menos un ítem")
      .max(30, "La lista no puede tener más de 30 ítems"),
  })
  .strict();

const specsBlockSchema = z
  .object({
    type: z.literal("specs"),
    items: z
      .array(
        z
          .object({
            label: z
              .string()
              .trim()
              .min(1, "La etiqueta de la especificación no puede estar vacía")
              .max(100, "La etiqueta no puede superar los 100 caracteres"),
            value: z
              .string()
              .trim()
              .min(1, "El valor de la especificación no puede estar vacío")
              .max(500, "El valor no puede superar los 500 caracteres"),
          })
          .strict(),
      )
      .min(1, "Las especificaciones deben tener al menos un ítem")
      .max(30, "Las especificaciones no pueden tener más de 30 ítems"),
  })
  .strict();

export const productRichContentBlockSchema = z.discriminatedUnion("type", [
  headingBlockSchema,
  paragraphBlockSchema,
  listBlockSchema,
  specsBlockSchema,
]);

export const productRichContentSchema = z
  .object({
    version: z.literal(1, {
      message: "La versión del contenido debe ser 1",
    }),
    blocks: z
      .array(productRichContentBlockSchema)
      .min(1, "Agregá al menos un bloque de contenido")
      .max(30, "El contenido no puede tener más de 30 bloques"),
  })
  .strict()
  .superRefine((value, context) => {
    const bytes = new TextEncoder().encode(JSON.stringify(value)).length;

    if (bytes > MAX_RICH_CONTENT_BYTES) {
      context.addIssue({
        code: "custom",
        message: "El contenido detallado no puede superar los 64KB",
      });
    }
  });

export type ProductRichContentFormValue = z.infer<
  typeof productRichContentSchema
>;

export const getProductRichContentErrorMessage = (
  error: z.ZodError,
): string => {
  const issue = error.issues[0];

  if (!issue) return "El contenido detallado no es válido";

  const blockPathIndex = issue.path.findIndex((pathValue) => {
    return pathValue === "blocks";
  });
  const blockIndex = issue.path[blockPathIndex + 1];

  if (typeof blockIndex === "number") {
    return `Bloque ${blockIndex + 1}: ${issue.message}`;
  }

  return issue.message;
};
