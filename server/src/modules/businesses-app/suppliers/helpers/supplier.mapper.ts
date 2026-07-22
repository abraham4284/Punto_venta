import type { Supplier, SupplierDbRow } from "../types/index.js";

export function mapSupplier(row: SupplierDbRow): Supplier {
  return {
    idSupplier: row.idSupplier,
    idBusiness: row.idBusiness,
    name: row.name,
    phone: row.phone,
    email: row.email,
    address: row.address,
    observation: row.observation,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
