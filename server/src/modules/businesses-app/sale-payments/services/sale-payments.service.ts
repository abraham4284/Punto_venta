import type { RowDataPacket } from "mysql2/promise";
import { pool } from "@/db/db.js";
import {
  mapSalePayment,
  mapSalePaymentEvent,
} from "../helpers/sale-payment.mapper.js";
import { listPaymentMethodsService } from "../../payment-methods/services/payment-methods.service.js";
import type {
  CollectPaymentMethodResponse,
  CreateSalePaymentPayload,
  SalePaymentAccessFilters,
  SalePaymentActionPayload,
  SalePaymentDbRow,
  SalePaymentEventDbRow,
  SalePaymentEventResponse,
  SalePaymentResponse,
  UpdateSalePaymentPayload,
} from "../types/index.js";

interface CountRow extends RowDataPacket {
  total: number;
}

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

export async function canAccessSalePaymentsBySaleService(
  idSale: number,
  filters: SalePaymentAccessFilters,
): Promise<boolean> {
  if (filters.actorCanViewAll) {
    const [rows] = await pool.query<CountRow[]>(
      "SELECT COUNT(*) AS total FROM sales WHERE idBusiness = ? AND idSale = ?",
      [filters.idBusiness, idSale],
    );

    return Number(rows[0]?.total ?? 0) > 0;
  }

  const [rows] = await pool.query<CountRow[]>(
    `SELECT COUNT(*) AS total
     FROM sale_deliveries sd
     INNER JOIN sales s
       ON s.idBusiness = sd.idBusiness
       AND s.idSale = sd.idSale
     WHERE s.idBusiness = ?
       AND s.idSale = ?
       AND sd.assigned_to_user_id = ?`,
    [filters.idBusiness, idSale, filters.idUser],
  );

  return Number(rows[0]?.total ?? 0) > 0;
}

export async function canAccessSalePaymentService(
  idSalePayment: number,
  filters: SalePaymentAccessFilters,
): Promise<boolean> {
  if (filters.actorCanViewAll) {
    const [rows] = await pool.query<CountRow[]>(
      `SELECT COUNT(*) AS total
       FROM sale_payments
       WHERE idBusiness = ?
         AND idSalePayment = ?`,
      [filters.idBusiness, idSalePayment],
    );

    return Number(rows[0]?.total ?? 0) > 0;
  }

  const [rows] = await pool.query<CountRow[]>(
    `SELECT COUNT(*) AS total
     FROM sale_payments sp
     INNER JOIN sale_deliveries sd
       ON sd.idBusiness = sp.idBusiness
       AND sd.idSale = sp.idSale
     WHERE sp.idBusiness = ?
       AND sp.idSalePayment = ?
       AND sd.assigned_to_user_id = ?`,
    [filters.idBusiness, idSalePayment, filters.idUser],
  );

  return Number(rows[0]?.total ?? 0) > 0;
}

export async function getSalePaymentEventsService(
  idBusiness: number,
  idSalePayment: number,
): Promise<SalePaymentEventResponse[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_sale_payment_events_list(?, ?)",
    [idBusiness, idSalePayment],
  );
  const result = rows as unknown as SalePaymentEventDbRow[][];

  return (result[0] ?? []).map(mapSalePaymentEvent);
}

export async function listCollectPaymentMethodsService(
  idBusiness: number,
): Promise<CollectPaymentMethodResponse[]> {
  const paymentMethods = await listPaymentMethodsService({
    idBusiness,
    onlyActive: true,
  });

  return paymentMethods
    .filter(function filterCashMethod(paymentMethod) {
      return paymentMethod.isActive && paymentMethod.affectsCash;
    })
    .map(function mapCollectMethod(paymentMethod) {
      return {
        idPaymentMethod: paymentMethod.idPaymentMethod,
        code: paymentMethod.code,
        name: paymentMethod.name,
        affectsCash: paymentMethod.affectsCash,
      };
    });
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
