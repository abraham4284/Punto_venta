import { z } from "zod";

const publicCatalogSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2)
  .max(180)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export interface PublicCatalogConfig {
  businessSlug: string | null;
  enabled: boolean;
}

function createPublicCatalogConfig(): PublicCatalogConfig {
  const rawSlug = process.env.PUBLIC_CATALOG_BUSINESS_SLUG?.trim();

  if (!rawSlug) {
    return {
      businessSlug: null,
      enabled: false,
    };
  }

  const validation = publicCatalogSlugSchema.safeParse(rawSlug);

  if (!validation.success) {
    throw new Error("PUBLIC_CATALOG_BUSINESS_SLUG debe tener formato valido");
  }

  return {
    businessSlug: validation.data,
    enabled: true,
  };
}

export const publicCatalogConfig = createPublicCatalogConfig();
