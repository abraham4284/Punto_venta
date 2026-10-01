import { z } from "zod";

const MAX_SERIALIZED_BYTES = 64 * 1024;

const trimmedRequiredText = z.string().trim().min(1);

const paragraphBlockSchema = z
  .object({
    type: z.literal("paragraph"),
    text: trimmedRequiredText.max(3000),
  })
  .strict();

const headingBlockSchema = z
  .object({
    type: z.literal("heading"),
    level: z.union([z.literal(2), z.literal(3)]),
    text: trimmedRequiredText.max(150),
  })
  .strict();

const listBlockSchema = z
  .object({
    type: z.literal("list"),
    style: z.enum(["bullet", "numbered"]),
    items: z.array(trimmedRequiredText.max(500)).min(1).max(30),
  })
  .strict();

const specsItemSchema = z
  .object({
    label: trimmedRequiredText.max(100),
    value: trimmedRequiredText.max(500),
  })
  .strict();

const specsBlockSchema = z
  .object({
    type: z.literal("specs"),
    items: z.array(specsItemSchema).min(1).max(30),
  })
  .strict();

export const productRichContentBlockSchema = z.discriminatedUnion("type", [
  paragraphBlockSchema,
  headingBlockSchema,
  listBlockSchema,
  specsBlockSchema,
]);

export const productRichContentSchema = z
  .object({
    version: z.literal(1),
    blocks: z.array(productRichContentBlockSchema).max(30),
  })
  .strict()
  .superRefine(function validateSerializedSize(value, context) {
    const serialized = JSON.stringify(value);

    if (Buffer.byteLength(serialized, "utf8") > MAX_SERIALIZED_BYTES) {
      context.addIssue({
        code: "custom",
        message: "El contenido enriquecido no puede superar 64 KB",
      });
    }
  });

export type ProductRichContentBlock = z.infer<
  typeof productRichContentBlockSchema
>;

export type ProductRichContent = z.infer<typeof productRichContentSchema>;

export function serializeProductRichContent(
  content: ProductRichContent | null | undefined,
): string | null {
  if (content === undefined || content === null) {
    return null;
  }

  const parsed = productRichContentSchema.parse(content);

  return JSON.stringify(parsed);
}

export function parseProductRichContentFromDb(
  value: unknown,
): ProductRichContent | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    try {
      return productRichContentSchema.parse(JSON.parse(value));
    } catch (error) {
      throw new Error("PRODUCT_RICH_CONTENT_INVALID");
    }
  }

  try {
    return productRichContentSchema.parse(value);
  } catch (error) {
    throw new Error("PRODUCT_RICH_CONTENT_INVALID");
  }
}
