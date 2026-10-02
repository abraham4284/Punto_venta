import { randomUUID } from "node:crypto";
import { normalizeSlugBase } from "@/shared/slug.js";
import { executeInsert } from "@/tests/helpers/test-database.helper.js";

export interface ProductCategoryFixture {
  idProductCategory: number;
  idBusiness: number;
  name: string;
  slug: string;
}

export async function createProductCategoryFixture(
  idBusiness: number,
  namePrefix = "Categoria",
): Promise<ProductCategoryFixture> {
  const name = `${namePrefix} ${randomUUID().slice(0, 8)}`;
  const slug = normalizeSlugBase(name);
  const idProductCategory = await executeInsert(
    `INSERT INTO product_categories (idBusiness, name, slug, description, is_default, is_active)
     VALUES (?, ?, ?, ?, 0, 1)`,
    [idBusiness, name, slug, "Categoria fixture"],
  );

  return { idProductCategory, idBusiness, name, slug };
}
