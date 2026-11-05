import { Decimal } from "decimal.js";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import type { CreateSalePayload } from "../types/index.js";

const messages = {
  WHOLESALE_DISABLED: "La venta mayorista no esta habilitada para este negocio",
  WHOLESALE_CUSTOMER_REQUIRED: "La venta mayorista requiere un cliente",
  WHOLESALE_CUSTOMER_NOT_FOUND: "El cliente no pertenece al negocio",
  WHOLESALE_CUSTOMER_INACTIVE: "El cliente esta inactivo",
  WHOLESALE_CUSTOMER_INVALID: "El cliente no pertenece al negocio o esta inactivo",
  WHOLESALE_MINIMUM_NOT_REACHED: "No se alcanza el minimo de la primera compra mayorista",
  WHOLESALE_PRICE_MISSING: "Un producto no tiene precio mayorista valido o no esta disponible",
  WHOLESALE_PRICE_MISMATCH: "El precio aplicado debe coincidir con el precio mayorista vigente",
  WHOLESALE_INVALID_QUANTITY: "La cantidad mayorista no es valida para la precision o unidad del producto",
} as const;

export class WholesalePricingError extends Error {
  constructor(public readonly code: keyof typeof messages) {
    super(messages[code]);
  }
}

interface PolicyRow extends RowDataPacket {
  wholesale_enabled: number;
  wholesale_minimum_amount: string | number | null;
}
interface CustomerRow extends RowDataPacket {
  pricing_tier: "RETAIL" | "WHOLESALE";
  is_active: number;
}
interface ProductRow extends RowDataPacket {
  price_wholesale: string | number | null;
  unit_type: string;
}

/** Called only for a NEW header, inside its caller's transaction. Replay skips all effects. */
export async function applyWholesalePricing(
  connection: PoolConnection, data: CreateSalePayload, idSale: number,
): Promise<void> {
  if ((data.pricingType ?? "RETAIL") !== "WHOLESALE") return;
  if (!data.idCustomer) throw new WholesalePricingError("WHOLESALE_CUSTOMER_REQUIRED");

  const [policies] = await connection.query<PolicyRow[]>(
    `SELECT wholesale_enabled, wholesale_minimum_amount FROM businesses
     WHERE idBusiness = ? AND is_active = 1 LOCK IN SHARE MODE`, [data.idBusiness],
  );
  const policy = policies[0];
  if (!policy?.wholesale_enabled || policy.wholesale_minimum_amount == null
      || !new Decimal(policy.wholesale_minimum_amount).gt(0)) {
    throw new WholesalePricingError("WHOLESALE_DISABLED");
  }
  const [customers] = await connection.query<CustomerRow[]>(
    `SELECT pricing_tier, is_active FROM customers
     WHERE idBusiness = ? AND idCustomer = ? FOR UPDATE`, [data.idBusiness, data.idCustomer],
  );
  const customer = customers[0];
  if (!customer) throw new WholesalePricingError("WHOLESALE_CUSTOMER_NOT_FOUND");
  if (!customer.is_active) throw new WholesalePricingError("WHOLESALE_CUSTOMER_INACTIVE");

  let candidate = new Decimal(0);
  for (const item of [...data.items].sort(function byProduct(a, b) { return a.idProduct - b.idProduct; })) {
    const [products] = await connection.query<ProductRow[]>(
      `SELECT price_wholesale, unit_type FROM products
       WHERE idBusiness = ? AND idProduct = ? AND is_active = 1 FOR UPDATE`,
      [data.idBusiness, item.idProduct],
    );
    const product = products[0];
    if (product?.price_wholesale == null || !new Decimal(product.price_wholesale).gt(0)) {
      throw new WholesalePricingError("WHOLESALE_PRICE_MISSING");
    }
    const quantity = new Decimal(item.quantity);
    if (!quantity.gt(0) || quantity.decimalPlaces() > 2
        || (product.unit_type === "UNIT" && !quantity.isInteger())) {
      throw new WholesalePricingError("WHOLESALE_INVALID_QUANTITY");
    }
    if (!new Decimal(item.unitPrice).eq(product.price_wholesale)) {
      throw new WholesalePricingError("WHOLESALE_PRICE_MISMATCH");
    }
    // Initial threshold is merchandise at catalog wholesale prices, before discounts/shipping.
    candidate = candidate.plus(quantity.mul(product.price_wholesale).toDecimalPlaces(2, Decimal.ROUND_HALF_UP));
  }
  if (customer.pricing_tier === "RETAIL" && candidate.lt(policy.wholesale_minimum_amount)) {
    throw new WholesalePricingError("WHOLESALE_MINIMUM_NOT_REACHED");
  }
  await connection.query(
    "UPDATE sales SET pricing_type = 'WHOLESALE' WHERE idBusiness = ? AND idSale = ?",
    [data.idBusiness, idSale],
  );
  if (customer.pricing_tier === "RETAIL") {
    await connection.query(
      `UPDATE customers SET pricing_tier = 'WHOLESALE', wholesale_since = NOW(), updated_at = NOW()
       WHERE idBusiness = ? AND idCustomer = ? AND pricing_tier = 'RETAIL'`,
      [data.idBusiness, data.idCustomer],
    );
  }
}
