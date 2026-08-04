import type { RowDataPacket } from "mysql2/promise";
import { pool } from "@/db/db.js";
import { mapPaymentMethod } from "../helpers/payment-method.mapper.js";
import type {
  ChangePaymentMethodStatusPayload,
  CreatePaymentMethodPayload,
  ListPaymentMethodsPayload,
  PaymentMethodDbRow,
  PaymentMethodIdPayload,
  PaymentMethodResponse,
  UpdatePaymentMethodPayload,
} from "../types/index.js";

function getFirstPaymentMethod(rows: RowDataPacket[]): PaymentMethodResponse {
  const result = rows as unknown as PaymentMethodDbRow[][];
  const paymentMethod = result[0]?.[0];

  if (!paymentMethod) {
    throw new Error("PAYMENT_METHOD_NOT_FOUND");
  }

  return mapPaymentMethod(paymentMethod);
}

export async function listPaymentMethodsService(
  data: ListPaymentMethodsPayload,
): Promise<PaymentMethodResponse[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_payment_method_list(?, ?)",
    [data.idBusiness, data.onlyActive ? 1 : 0],
  );

  const result = rows as unknown as PaymentMethodDbRow[][];
  return (result[0] ?? []).map(mapPaymentMethod);
}

export async function getPaymentMethodByIdService(
  data: PaymentMethodIdPayload,
): Promise<PaymentMethodResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_payment_method_get_by_id(?, ?)",
    [data.idBusiness, data.idPaymentMethod],
  );

  return getFirstPaymentMethod(rows);
}

export async function createPaymentMethodService(
  data: CreatePaymentMethodPayload,
): Promise<PaymentMethodResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_payment_method_create(?, ?, ?, ?)",
    [data.idBusiness, data.code, data.name, data.idUser],
  );

  return getFirstPaymentMethod(rows);
}

export async function updatePaymentMethodService(
  data: UpdatePaymentMethodPayload,
): Promise<PaymentMethodResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_payment_method_update(?, ?, ?)",
    [data.idBusiness, data.idPaymentMethod, data.name],
  );

  return getFirstPaymentMethod(rows);
}

export async function changePaymentMethodStatusService(
  data: ChangePaymentMethodStatusPayload,
): Promise<PaymentMethodResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_payment_method_change_status(?, ?, ?)",
    [data.idBusiness, data.idPaymentMethod, data.isActive ? 1 : 0],
  );

  return getFirstPaymentMethod(rows);
}

export async function setDefaultPaymentMethodService(
  data: PaymentMethodIdPayload,
): Promise<PaymentMethodResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_payment_method_set_default(?, ?)",
    [data.idBusiness, data.idPaymentMethod],
  );

  return getFirstPaymentMethod(rows);
}
