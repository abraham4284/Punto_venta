import { Decimal } from "decimal.js";
import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { pool } from "@/db/db.js";
import {
  mapCashSettlement,
  mapCashSettlementPayment,
  mapPendingCashSettlementPayment,
} from "../helpers/cash-settlement.mapper.js";
import type {
  CashSettlementDbRow,
  CashSettlementListFilters,
  CashSettlementPaymentDbRow,
  CashSettlementResponse,
  CashSettlementWithPaymentsResponse,
  CreateCashSettlementPayload,
  PaginatedCashSettlementsResponse,
  PendingCashSettlementCollectorResponse,
  PendingCashSettlementFilters,
  PendingCashSettlementPaymentDbRow,
  PendingCashSettlementsResponse,
  TotalRecordsDbRow,
} from "../types/index.js";

interface CashSessionLockRow extends RowDataPacket {
  status: string;
}

interface UserValidationRow extends RowDataPacket {
  total: number;
}

interface SalePaymentLockRow extends RowDataPacket {
  idSalePayment: number;
  amount: string | number;
  status: string;
  idCashSettlement: number | null;
  collected_by_user_id: number | null;
  affects_cash: number;
}

function createPlaceholders(count: number): string {
  return new Array(count).fill("?").join(", ");
}

function getSortedUniquePaymentIds(ids: number[]): number[] {
  return Array.from(new Set(ids)).sort(function sortIds(first, second) {
    return first - second;
  });
}

function assertNoDuplicatePaymentIds(ids: number[]): void {
  if (new Set(ids).size !== ids.length) {
    throw new Error("CASH_SETTLEMENT_DUPLICATE_PAYMENT_IDS");
  }
}

async function validateCashSessionForSettlement(
  connection: PoolConnection,
  idBusiness: number,
  idCashSession: number,
): Promise<void> {
  const [rows] = await connection.query<CashSessionLockRow[]>(
    `SELECT status
       FROM cash_sessions
      WHERE idBusiness = ?
        AND idCashSession = ?
      LIMIT 1
      FOR UPDATE`,
    [idBusiness, idCashSession],
  );
  const cashSession = rows[0];

  if (!cashSession) {
    throw new Error("CASH_SESSION_NOT_FOUND");
  }

  if (cashSession.status !== "OPEN") {
    throw new Error("CASH_SESSION_CLOSED");
  }
}

async function validateSettlementUser(
  connection: PoolConnection,
  input: {
    idBusiness: number;
    idUser: number;
    allowedRoles: string[];
    errorMessage: string;
  },
): Promise<void> {
  const placeholders = createPlaceholders(input.allowedRoles.length);
  const [rows] = await connection.query<UserValidationRow[]>(
    `SELECT COUNT(*) AS total
       FROM business_users bu
       INNER JOIN users u
          ON u.idUser = bu.idUser
      WHERE bu.idBusiness = ?
        AND bu.idUser = ?
        AND bu.role IN (${placeholders})
        AND bu.is_active = 1
        AND u.is_active = 1`,
    [input.idBusiness, input.idUser, ...input.allowedRoles],
  );

  if (Number(rows[0]?.total ?? 0) === 0) {
    throw new Error(input.errorMessage);
  }
}

async function getLockedSettlementPayments(
  connection: PoolConnection,
  input: {
    idBusiness: number;
    collectorUserId: number;
    salePaymentIds: number[];
  },
): Promise<SalePaymentLockRow[]> {
  const placeholders = createPlaceholders(input.salePaymentIds.length);
  const [rows] = await connection.query<SalePaymentLockRow[]>(
    `SELECT
        sp.idSalePayment,
        sp.amount,
        sp.status,
        sp.idCashSettlement,
        sp.collected_by_user_id,
        pm.affects_cash
       FROM sale_payments sp
       INNER JOIN payment_methods pm
          ON pm.idBusiness = sp.idBusiness
         AND pm.idPaymentMethod = sp.idPaymentMethod
      WHERE sp.idBusiness = ?
        AND sp.idSalePayment IN (${placeholders})
      ORDER BY sp.idSalePayment ASC
      FOR UPDATE`,
    [input.idBusiness, ...input.salePaymentIds],
  );

  return rows;
}

function validateLockedPayments(
  payments: SalePaymentLockRow[],
  input: {
    requestedPaymentIds: number[];
    collectorUserId: number;
  },
): void {
  if (payments.length !== input.requestedPaymentIds.length) {
    throw new Error("CASH_SETTLEMENT_PAYMENT_NOT_ELIGIBLE");
  }

  for (const payment of payments) {
    if (payment.idCashSettlement !== null) {
      throw new Error("CASH_SETTLEMENT_PAYMENT_ALREADY_SETTLED");
    }

    if (payment.status !== "COLLECTED") {
      throw new Error("CASH_SETTLEMENT_PAYMENT_NOT_ELIGIBLE");
    }

    if (payment.collected_by_user_id !== input.collectorUserId) {
      throw new Error("CASH_SETTLEMENT_MIXED_COLLECTOR");
    }

    if (Number(payment.affects_cash) !== 1) {
      throw new Error("CASH_SETTLEMENT_PAYMENT_NOT_ELIGIBLE");
    }
  }
}

function calculateSettlementTotal(payments: SalePaymentLockRow[]): Decimal {
  return payments.reduce(function sumPayments(total, payment) {
    return total.plus(payment.amount);
  }, new Decimal(0));
}

async function createSettlementRow(
  connection: PoolConnection,
  data: CreateCashSettlementPayload,
  totalAmount: Decimal,
): Promise<number> {
  const [result] = await connection.query<ResultSetHeader>(
    `INSERT INTO cash_settlements (
       idBusiness,
       collector_user_id,
       received_by_user_id,
       idCashSession,
       total_amount,
       observation,
       settled_at,
       created_at
     )
     VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      data.idBusiness,
      data.collectorUserId,
      data.receivedByUserId,
      data.idCashSession,
      totalAmount.toFixed(2),
      data.observation ?? null,
    ],
  );

  return Number(result.insertId);
}

async function updateSelectedPaymentsAsSettled(
  connection: PoolConnection,
  input: {
    idBusiness: number;
    receivedByUserId: number;
    idCashSession: number;
    idCashSettlement: number;
    salePaymentIds: number[];
  },
): Promise<void> {
  const placeholders = createPlaceholders(input.salePaymentIds.length);
  const [result] = await connection.query<ResultSetHeader>(
    `UPDATE sale_payments
        SET status = 'CONFIRMED',
            confirmed_by_user_id = ?,
            confirmed_at = NOW(),
            idCashSession = ?,
            idCashSettlement = ?
      WHERE idBusiness = ?
        AND idSalePayment IN (${placeholders})
        AND status = 'COLLECTED'
        AND idCashSettlement IS NULL`,
    [
      input.receivedByUserId,
      input.idCashSession,
      input.idCashSettlement,
      input.idBusiness,
      ...input.salePaymentIds,
    ],
  );

  if (result.affectedRows !== input.salePaymentIds.length) {
    throw new Error("CASH_SETTLEMENT_PAYMENT_NOT_ELIGIBLE");
  }
}

async function createSettlementEvents(
  connection: PoolConnection,
  input: {
    idBusiness: number;
    receivedByUserId: number;
    idCashSession: number;
    idCashSettlement: number;
    salePaymentIds: number[];
  },
): Promise<void> {
  for (const idSalePayment of input.salePaymentIds) {
    await connection.query<ResultSetHeader>(
      `INSERT INTO sale_payment_events (
         idBusiness,
         idSalePayment,
         event_type,
         previous_status,
         new_status,
         metadata,
         created_by_user_id
       )
       VALUES (?, ?, 'PAYMENT_SETTLED', 'COLLECTED', 'CONFIRMED', JSON_OBJECT('idCashSettlement', ?, 'idCashSession', ?), ?)`,
      [
        input.idBusiness,
        idSalePayment,
        input.idCashSettlement,
        input.idCashSession,
        input.receivedByUserId,
      ],
    );
  }
}

function groupPendingPaymentsByCollector(
  rows: PendingCashSettlementPaymentDbRow[],
): PendingCashSettlementCollectorResponse[] {
  const collectors = new Map<number, PendingCashSettlementCollectorResponse>();

  for (const row of rows) {
    const collectorUserId = row.collector_user_id;
    const payment = mapPendingCashSettlementPayment(row);
    const current = collectors.get(collectorUserId);

    if (!current) {
      collectors.set(collectorUserId, {
        collectorUserId,
        collectorUserName: row.collector_user_name,
        paymentsCount: 1,
        totalAmount: payment.amount,
        payments: [payment],
      });
      continue;
    }

    current.paymentsCount += 1;
    current.totalAmount = Number(
      new Decimal(current.totalAmount).plus(payment.amount).toFixed(2),
    );
    current.payments.push(payment);
  }

  return Array.from(collectors.values());
}

export async function listCashSettlementsService(
  filters: CashSettlementListFilters,
): Promise<PaginatedCashSettlementsResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_cash_settlements_list(?, ?, ?, ?, ?, ?)",
    [
      filters.idBusiness,
      filters.limit,
      filters.offset,
      filters.collectorUserId ?? null,
      filters.startDate ?? null,
      filters.endDate ?? null,
    ],
  );
  const result = rows as unknown as [CashSettlementDbRow[], TotalRecordsDbRow[]];
  const totalRecords = Number(result[1]?.[0]?.totalRecords ?? 0);

  return {
    settlements: (result[0] ?? []).map(mapCashSettlement),
    pagination: {
      totalRecords,
      currentPage: filters.page,
      totalPages: Math.max(Math.ceil(totalRecords / filters.limit), 1),
      limit: filters.limit,
    },
  };
}

export async function getCashSettlementByIdService(
  idBusiness: number,
  idCashSettlement: number,
): Promise<CashSettlementWithPaymentsResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_cash_settlement_get_by_id(?, ?)",
    [idBusiness, idCashSettlement],
  );
  const result = rows as unknown as [
    CashSettlementDbRow[],
    CashSettlementPaymentDbRow[],
  ];
  const settlement = result[0]?.[0];

  if (!settlement) {
    throw new Error("Liquidacion no encontrada");
  }

  return {
    ...mapCashSettlement(settlement),
    payments: (result[1] ?? []).map(mapCashSettlementPayment),
  };
}

export async function createCashSettlementService(
  data: CreateCashSettlementPayload,
): Promise<CashSettlementWithPaymentsResponse> {
  assertNoDuplicatePaymentIds(data.salePaymentIds);

  const connection = await pool.getConnection();
  const salePaymentIds = getSortedUniquePaymentIds(data.salePaymentIds);
  let idCashSettlement: number | null = null;

  try {
    await connection.beginTransaction();
    await validateCashSessionForSettlement(
      connection,
      data.idBusiness,
      data.idCashSession,
    );
    await validateSettlementUser(connection, {
      idBusiness: data.idBusiness,
      idUser: data.collectorUserId,
      allowedRoles: ["DELIVERY", "ADMIN", "OWNER"],
      errorMessage: "COLLECTOR_USER_NOT_FOUND",
    });
    await validateSettlementUser(connection, {
      idBusiness: data.idBusiness,
      idUser: data.receivedByUserId,
      allowedRoles: ["ADMIN", "OWNER"],
      errorMessage: "RECEIVER_USER_NOT_FOUND",
    });

    const payments = await getLockedSettlementPayments(connection, {
      idBusiness: data.idBusiness,
      collectorUserId: data.collectorUserId,
      salePaymentIds,
    });

    validateLockedPayments(payments, {
      requestedPaymentIds: salePaymentIds,
      collectorUserId: data.collectorUserId,
    });

    idCashSettlement = await createSettlementRow(
      connection,
      data,
      calculateSettlementTotal(payments),
    );

    await updateSelectedPaymentsAsSettled(connection, {
      idBusiness: data.idBusiness,
      receivedByUserId: data.receivedByUserId,
      idCashSession: data.idCashSession,
      idCashSettlement,
      salePaymentIds,
    });
    await createSettlementEvents(connection, {
      idBusiness: data.idBusiness,
      receivedByUserId: data.receivedByUserId,
      idCashSession: data.idCashSession,
      idCashSettlement,
      salePaymentIds,
    });

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  if (idCashSettlement === null) {
    throw new Error("No se pudo crear la liquidacion");
  }

  return getCashSettlementByIdService(data.idBusiness, idCashSettlement);
}

export async function getPendingCashSettlementsService(
  filters: PendingCashSettlementFilters,
): Promise<PendingCashSettlementsResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_cash_settlement_pending_list(?, ?)",
    [filters.idBusiness, filters.collectorUserId ?? null],
  );
  const result = rows as unknown as [PendingCashSettlementPaymentDbRow[]];

  return {
    collectors: groupPendingPaymentsByCollector(result[0] ?? []),
  };
}
