import { Decimal } from "decimal.js";
import type { RowDataPacket } from "mysql2";
import { pool } from "@/db/db.js";
import { querySingleRow } from "@/tests/helpers/test-database.helper.js";

export interface StockMovementRow extends RowDataPacket {
  idStockMovement: number;
  idBusiness: number;
  idProduct: number;
  idUser: number;
  movement_type:
    | "PURCHASE"
    | "SALE"
    | "TRANSFER_IN"
    | "TRANSFER_OUT"
    | "ADJUSTMENT_IN"
    | "ADJUSTMENT_OUT";
  idDepositFrom: number | null;
  idDepositTo: number | null;
  quantity: string;
  reference_type: "SALE" | "PURCHASE" | "TRANSFER" | "ADJUSTMENT" | null;
  reference_id: number | null;
  observation: string | null;
}

interface QuantityRow extends RowDataPacket {
  quantity: string | number;
}

interface CountRow extends RowDataPacket {
  total: number;
}

interface SaleStateRow extends RowDataPacket {
  idSale: number;
  idBusiness: number;
  idDeposit: number;
  idCashSession: number;
  idPaymentMethod: number | null;
  idUser: number;
  status: "COMPLETED" | "CANCELLED";
  total: string;
}

interface PurchaseStateRow extends RowDataPacket {
  idPurchase: number;
  idBusiness: number;
  idSupplier: number | null;
  idUser: number;
  status: "COMPLETED" | "CANCELLED";
  total: string;
}

interface CashSessionStateRow extends RowDataPacket {
  idCashSession: number;
  idBusiness: number;
  idCashRegister: number;
  opened_by_user_id: number;
  closed_by_user_id: number | null;
  status: "OPEN" | "CLOSED";
  opening_amount: string;
  expected_cash_amount: string | null;
  counted_cash_amount: string | null;
  difference_amount: string | null;
  closed_at: Date | null;
}

export interface CashPaymentSummaryRow extends RowDataPacket {
  idCashSession: number;
  idPaymentMethod: number;
  sales_count: number;
  payments_count: number;
  total_amount: string;
}

export function decimalEquals(
  actual: string | number | null | undefined,
  expected: string | number,
): boolean {
  if (actual === null || actual === undefined) return false;
  return new Decimal(actual).equals(new Decimal(expected));
}

export async function getStockQuantity(input: {
  idBusiness: number;
  idProduct: number;
  idDeposit: number;
}): Promise<Decimal> {
  const row = await querySingleRow<QuantityRow>(
    "SELECT quantity FROM stock WHERE idBusiness = ? AND idProduct = ? AND idDeposit = ?",
    [input.idBusiness, input.idProduct, input.idDeposit],
  );

  return new Decimal(row?.quantity ?? 0);
}

export async function getStockMovementRows(input: {
  idBusiness: number;
  referenceType?: "SALE" | "PURCHASE" | "TRANSFER" | "ADJUSTMENT";
  referenceId?: number;
  idProduct?: number;
  observation?: string;
}): Promise<StockMovementRow[]> {
  const clauses = ["idBusiness = ?"];
  const values: unknown[] = [input.idBusiness];

  if (input.referenceType) {
    clauses.push("reference_type = ?");
    values.push(input.referenceType);
  }

  if (input.referenceId !== undefined) {
    clauses.push("reference_id = ?");
    values.push(input.referenceId);
  }

  if (input.idProduct !== undefined) {
    clauses.push("idProduct = ?");
    values.push(input.idProduct);
  }

  if (input.observation !== undefined) {
    clauses.push("observation = ?");
    values.push(input.observation);
  }

  const [rows] = await pool.query<StockMovementRow[]>(
    `SELECT *
     FROM stock_movements
     WHERE ${clauses.join(" AND ")}
     ORDER BY idStockMovement ASC`,
    values,
  );

  return rows;
}

export async function getSaleState(idSale: number): Promise<SaleStateRow | null> {
  return querySingleRow<SaleStateRow>(
    `SELECT
       s.idSale,
       s.idBusiness,
       s.idDeposit,
       s.idCashSession,
       MIN(sp.idPaymentMethod) AS idPaymentMethod,
       s.idUser,
       s.status,
       s.total
     FROM sales s
     LEFT JOIN sale_payments sp
       ON sp.idBusiness = s.idBusiness
       AND sp.idSale = s.idSale
       AND sp.status <> 'CANCELLED'
     WHERE s.idSale = ?
     GROUP BY
       s.idSale,
       s.idBusiness,
       s.idDeposit,
       s.idCashSession,
       s.idUser,
       s.status,
       s.total`,
    [idSale],
  );
}

export async function getPurchaseState(
  idPurchase: number,
): Promise<PurchaseStateRow | null> {
  return querySingleRow<PurchaseStateRow>(
    "SELECT idPurchase, idBusiness, idSupplier, idUser, status, total FROM purchases WHERE idPurchase = ?",
    [idPurchase],
  );
}

export async function getCashSessionState(
  idCashSession: number,
): Promise<CashSessionStateRow | null> {
  return querySingleRow<CashSessionStateRow>(
    `SELECT idCashSession, idBusiness, idCashRegister, opened_by_user_id,
      closed_by_user_id, status, opening_amount, expected_cash_amount,
      counted_cash_amount, difference_amount, closed_at
     FROM cash_sessions
     WHERE idCashSession = ?`,
    [idCashSession],
  );
}

export async function getPaymentSummary(input: {
  idCashSession: number;
  idPaymentMethod: number;
}): Promise<CashPaymentSummaryRow | null> {
  return querySingleRow<CashPaymentSummaryRow>(
    `SELECT
       idCashSession,
       idPaymentMethod,
       payments_count AS sales_count,
       payments_count,
       total_amount
     FROM cash_session_payment_summaries
     WHERE idCashSession = ? AND idPaymentMethod = ?`,
    [input.idCashSession, input.idPaymentMethod],
  );
}

export async function countRows(table: string, whereSql: string, values: unknown[]): Promise<number> {
  const row = await querySingleRow<CountRow>(
    `SELECT COUNT(*) AS total FROM \`${table}\` WHERE ${whereSql}`,
    values,
  );

  return Number(row?.total ?? 0);
}
