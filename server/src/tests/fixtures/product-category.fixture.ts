import { randomUUID } from "node:crypto";
import { executeInsert } from "@/tests/helpers/test-database.helper.js";

export interface ProductCategoryFixture {
  idProductCategory: number;
  idBusiness: number;
  name: string;
}

export async function createProductCategoryFixture(
  idBusiness: number,
  namePrefix = "Categoria",
): Promise<ProductCategoryFixture> {
  const name = `${namePrefix} ${randomUUID().slice(0, 8)}`;
  const idProductCategory = await executeInsert(
    `INSERT INTO product_categories (idBusiness, name, description, is_default, is_active)
     VALUES (?, ?, ?, 0, 1)`,
    [idBusiness, name, "Categoria fixture"],
  );

  return { idProductCategory, idBusiness, name };
}
