import { randomUUID } from "node:crypto";
import { normalizeSlugBase } from "@/shared/slug.js";
import { executeInsert } from "@/tests/helpers/test-database.helper.js";

export interface ProductFixture {
  idProduct: number;
  idBusiness: number;
  idProductCategory: number;
  name: string;
  slug: string;
  barcode: string;
}

export async function createProductFixture(input: {
  idBusiness: number;
  idProductCategory: number;
  idDeposit: number;
  namePrefix?: string;
  quantity?: number;
}): Promise<ProductFixture> {
  const suffix = randomUUID().replaceAll("-", "").slice(0, 10);
  const name = `${input.namePrefix ?? "Producto"} ${suffix}`;
  const slug = normalizeSlugBase(name);
  const barcode = `BAR${suffix}`;
  const idProduct = await executeInsert(
    `INSERT INTO products
      (idBusiness, idProductCategory, barcode, name, slug, description, price_cost, price_sale, price_wholesale, unit_type, sale_mode, availability_note, stock_min, is_active)
     VALUES (?, ?, ?, ?, ?, ?, 10, 20, NULL, 'UNIT', 'STOCK', NULL, 1, 1)`,
    [input.idBusiness, input.idProductCategory, barcode, name, slug, "Producto fixture"],
  );

  await executeInsert(
    `INSERT INTO stock (idBusiness, idProduct, idDeposit, quantity)
     VALUES (?, ?, ?, ?)`,
    [input.idBusiness, idProduct, input.idDeposit, input.quantity ?? 10],
  );

  return {
    idProduct,
    idBusiness: input.idBusiness,
    idProductCategory: input.idProductCategory,
    name,
    slug,
    barcode,
  };
}
