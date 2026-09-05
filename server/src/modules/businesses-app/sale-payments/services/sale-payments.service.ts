import type { RowDataPacket } from "mysql2/promise";
import { pool } from "@/db/db.js";
import { mapSalePayment } from "../helpers/sale-payment.mapper.js";
import type {
  CreateSalePaymentPayload,
  SalePaymentActionPayload,
  SalePaymentDbRow,
  SalePaymentResponse,
  UpdateSalePaymentPayload,
} from "../types/index.js";

function getFirstPayment(rows: RowDataPacket[], errorMessage: string): SalePaymentResponse {
  const result = rows as unknown as SalePaymentDbRow[][];
  const payment = result[0]?.[0];

  if (!payment) {
    throw new Error(errorMessage);
  }

  return mapSalePayment(payment);
}

export async function listSalePaymentsService(
  idBusiness: number,
  idSale: number,
): Promise<SalePaymentResponse[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_sale_payment_list_by_sale(?, ?)",
    [idBusiness, idSale],
  );
  const result = rows as unknown as SalePaymentDbRow[][];

  return (result[0] ?? []).map(mapSalePayment);
}

export async function createSalePaymentService(
  data: CreateSalePaymentPayload,
): Promise<SalePaymentResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_sale_payment_create(?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      data.idBusiness,
      data.idSale,
      data.idPaymentMethod,
      data.amount,
      data.status,
      data.idUser,
      data.idCashSession ?? null,
      data.reference ?? null,
      data.observation ?? null,
    ],
  );

  return getFirstPayment(rows, "No se pudo crear el pago de la venta");
}

export async function updateSalePaymentService(
  data: UpdateSalePaymentPayload,
): Promise<SalePaymentResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_sale_payment_update_pending(?, ?, ?, ?, ?, ?, ?)",
    [
      data.idBusiness,
      data.idSalePayment,
      data.idUser,
      data.idPaymentMethod,
      data.amount,
      data.reference ?? null,
      data.observation ?? null,
    ],
  );

  return getFirstPayment(rows, "No se pudo actualizar el pago de la venta");
}

export async function cancelSalePaymentService(
  data: SalePaymentActionPayload,
): Promise<SalePaymentResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_sale_payment_cancel_pending(?, ?, ?, ?)",
    [data.idBusiness, data.idSalePayment, data.idUser, data.reason ?? null],
  );

  return getFirstPayment(rows, "No se pudo anular el pago de la venta");
}

export async function collectSalePaymentService(
  data: SalePaymentActionPayload,
): Promise<SalePaymentResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_sale_payment_collect(?, ?, ?, ?, ?)",
    [
      data.idBusiness,
      data.idSalePayment,
      data.idUser,
      data.idPaymentMethod ?? null,
      data.observation ?? null,
    ],
  );

  return getFirstPayment(rows, "No se pudo cobrar el pago de la venta");
}

export async function confirmSalePaymentService(
  data: SalePaymentActionPayload,
): Promise<SalePaymentResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_sale_payment_confirm(?, ?, ?, ?)",
    [
      data.idBusiness,
      data.idSalePayment,
      data.idUser,
      data.idCashSession ?? null,
    ],
  );

  return getFirstPayment(rows, "No se pudo confirmar el pago de la venta");
}
