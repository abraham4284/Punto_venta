import type { RowDataPacket } from "mysql2";
import { pool } from "@/db/db.js";
import { mapCustomer } from "../helpers/customer.mapper.js";
import type {
  CreateCustomerPayload,
  CustomerDbRow,
  CustomerResponse,
  ToggleCustomerStatusPayload,
  UpdateCustomerPayload,
} from "../types/index.js";

export async function createCustomerService(
  data: CreateCustomerPayload,
): Promise<CustomerResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_create_customer(?, ?, ?, ?, ?, ?)",
    [
      data.idBusiness,
      data.name,
      data.phone ?? null,
      data.email ?? null,
      data.address ?? null,
      data.observation ?? null,
    ],
  );

  const result = rows as unknown as CustomerDbRow[][];
  const customer = result[0]?.[0];

  if (!customer) {
    throw new Error("No se pudo crear el cliente");
  }

  return mapCustomer(customer);
}

export async function getCustomersService(
  idBusiness: number,
): Promise<CustomerResponse[]> {
  const [rows] = await pool.query<RowDataPacket[]>("CALL sp_get_customers(?)", [
    idBusiness,
  ]);

  const result = rows as unknown as CustomerDbRow[][];
  return (result[0] ?? []).map(mapCustomer);
}

export async function getCustomerByIdService(
  idBusiness: number,
  idCustomer: number,
): Promise<CustomerResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_get_customer_by_id(?, ?)",
    [idBusiness, idCustomer],
  );

  const result = rows as unknown as CustomerDbRow[][];
  const customer = result[0]?.[0];

  if (!customer) {
    throw new Error("Cliente no encontrado");
  }

  return mapCustomer(customer);
}

export async function updateCustomerService(
  data: UpdateCustomerPayload,
): Promise<CustomerResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_update_customer(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      data.idBusiness,
      data.idCustomer,
      data.name ?? null,
      data.phone ?? null,
      Object.hasOwn(data, "phone") ? 1 : 0,
      data.email ?? null,
      Object.hasOwn(data, "email") ? 1 : 0,
      data.address ?? null,
      Object.hasOwn(data, "address") ? 1 : 0,
      data.observation ?? null,
      Object.hasOwn(data, "observation") ? 1 : 0,
    ],
  );

  const result = rows as unknown as CustomerDbRow[][];
  const customer = result[0]?.[0];

  if (!customer) {
    throw new Error("Cliente no encontrado");
  }

  return mapCustomer(customer);
}

export async function toggleCustomerStatusService(
  data: ToggleCustomerStatusPayload,
): Promise<CustomerResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_toggle_customer_status(?, ?, ?)",
    [data.idBusiness, data.idCustomer, data.isActive ? 1 : 0],
  );

  const result = rows as unknown as CustomerDbRow[][];
  const customer = result[0]?.[0];

  if (!customer) {
    throw new Error("Cliente no encontrado");
  }

  return mapCustomer(customer);
}
