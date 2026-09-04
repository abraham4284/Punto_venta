import type { RowDataPacket } from "mysql2/promise";
import { pool } from "@/db/db.js";
import {
  mapCashSettlement,
  mapCashSettlementPayment,
} from "../helpers/cash-settlement.mapper.js";
import type {
  CashSettlementDbRow,
  CashSettlementListFilters,
  CashSettlementPaymentDbRow,
  CashSettlementResponse,
  CashSettlementWithPaymentsResponse,
  CreateCashSettlementPayload,
  PaginatedCashSettlementsResponse,
  TotalRecordsDbRow,
} from "../types/index.js";

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
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_cash_settlement_create(?, ?, ?, ?, ?)",
    [
      data.idBusiness,
      data.collectorUserId,
      data.receivedByUserId,
      data.idCashSession,
      data.observation ?? null,
    ],
  );
  const result = rows as unknown as [
    CashSettlementDbRow[],
    CashSettlementPaymentDbRow[],
  ];
  const settlement = result[0]?.[0];

  if (!settlement) {
    throw new Error("No se pudo crear la liquidacion");
  }

  return {
    ...mapCashSettlement(settlement),
    payments: (result[1] ?? []).map(mapCashSettlementPayment),
  };
}
