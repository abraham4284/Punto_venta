import type { RowDataPacket } from "mysql2";
import { pool } from "@/db/db.js";
import { mapSupplier } from "../helpers/supplier.mapper.js";
import type {
  CreateSupplierInput,
  Supplier,
  SupplierDbRow,
  UpdateSupplierInput,
} from "../types/index.js";

export async function createSupplierService(
  data: CreateSupplierInput,
): Promise<Supplier> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_create_supplier(?, ?, ?, ?, ?, ?)",
    [
      data.idBusiness,
      data.name,
      data.phone ?? null,
      data.email ?? null,
      data.address ?? null,
      data.observation ?? null,
    ],
  );

  const result = rows as unknown as SupplierDbRow[][];
  const supplier = result[0]?.[0];

  if (!supplier) {
    throw new Error("No se pudo crear el proveedor");
  }

  return mapSupplier(supplier);
}

export async function getSuppliersService(
  idBusiness: number,
): Promise<Supplier[]> {
  const [rows] = await pool.query<RowDataPacket[]>("CALL sp_get_suppliers(?)", [
    idBusiness,
  ]);

  const result = rows as unknown as SupplierDbRow[][];
  return (result[0] ?? []).map(mapSupplier);
}

export async function getSupplierByIdService(
  idBusiness: number,
  idSupplier: number,
): Promise<Supplier> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_get_supplier_by_id(?, ?)",
    [idSupplier, idBusiness],
  );

  const result = rows as unknown as SupplierDbRow[][];
  const supplier = result[0]?.[0];

  if (!supplier) {
    throw new Error("Proveedor no encontrado");
  }

  return mapSupplier(supplier);
}

export async function updateSupplierService(
  data: UpdateSupplierInput,
): Promise<Supplier> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_update_supplier(?, ?, ?, ?, ?, ?, ?, ?)",
    [
      data.idSupplier,
      data.idBusiness,
      data.name,
      data.phone ?? null,
      data.email ?? null,
      data.address ?? null,
      data.observation ?? null,
      data.isActive ? 1 : 0,
    ],
  );

  const result = rows as unknown as SupplierDbRow[][];
  const supplier = result[0]?.[0];

  if (!supplier) {
    throw new Error("Proveedor no encontrado");
  }

  return mapSupplier(supplier);
}
