import type { RowDataPacket } from "mysql2/promise";
import { pool } from "@/db/db.js";
import { safeCreateBusinessNotification } from "@/modules/notifications/services/notifications.service.js";
import {
  mapCashLiveSummary,
  mapCashPaymentSummary,
  mapCashSession,
} from "../helpers/cash-session.mapper.js";
import type {
  CashLiveSummaryDbRow,
  CashLiveSummaryResponse,
  CashPaymentSummaryDbRow,
  CashSessionDbRow,
  CashSessionIdPayload,
  CashSessionListFilters,
  CashSessionPaymentSummaryResponse,
  CashSessionResponse,
  CloseCashSessionPayload,
  OpenCashSessionPayload,
  PaginatedCashSessionsResponse,
  TotalRecordsDbRow,
} from "../types/index.js";

function getFirstSession(rows: RowDataPacket[]): CashSessionResponse {
  const result = rows as unknown as CashSessionDbRow[][];
  const session = result[0]?.[0];

  if (!session) {
    throw new Error("CASH_SESSION_NOT_FOUND");
  }

  return mapCashSession(session);
}

export async function openCashSessionService(
  data: OpenCashSessionPayload,
): Promise<CashSessionResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_cash_session_open(?, ?, ?, ?, ?)",
    [
      data.idBusiness,
      data.idCashRegister,
      data.idUser,
      data.openingAmount,
      data.openingObservation ?? null,
    ],
  );

  return getFirstSession(rows);
}

export async function getCurrentCashSessionService(
  idBusiness: number,
  idCashRegister: number | null,
): Promise<CashSessionResponse | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_cash_session_get_current(?, ?)",
    [idBusiness, idCashRegister],
  );
  const result = rows as unknown as CashSessionDbRow[][];
  const session = result[0]?.[0];

  return session ? mapCashSession(session) : null;
}

export async function getCashSessionByIdService(
  data: CashSessionIdPayload,
): Promise<CashSessionResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_cash_session_get_by_id(?, ?)",
    [data.idBusiness, data.idCashSession],
  );

  return getFirstSession(rows);
}

export async function getCashSessionLiveSummaryService(
  data: CashSessionIdPayload,
): Promise<CashLiveSummaryResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_cash_session_get_live_summary(?, ?)",
    [data.idBusiness, data.idCashSession],
  );
  const result = rows as unknown as [CashLiveSummaryDbRow[], CashPaymentSummaryDbRow[]];
  const summary = result[0]?.[0];

  if (!summary) {
    throw new Error("CASH_SESSION_NOT_FOUND");
  }

  return mapCashLiveSummary(summary, result[1] ?? []);
}

export async function closeCashSessionService(
  data: CloseCashSessionPayload,
): Promise<{
  session: CashSessionResponse;
  paymentSummaries: CashSessionPaymentSummaryResponse[];
}> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_cash_session_close(?, ?, ?, ?, ?)",
    [
      data.idBusiness,
      data.idCashSession,
      data.idUser,
      data.countedCashAmount,
      data.closingObservation ?? null,
    ],
  );
  const result = rows as unknown as [CashSessionDbRow[], CashPaymentSummaryDbRow[]];
  const session = result[0]?.[0];

  if (!session) {
    throw new Error("CASH_SESSION_NOT_FOUND");
  }

  const mappedSession = mapCashSession(session);

  if (Number(mappedSession.differenceAmount) !== 0) {
    await safeCreateBusinessNotification({
      idBusiness: data.idBusiness,
      type: "CASH_SESSION_CLOSED_WITH_DIFFERENCE",
      severity: "WARNING",
      title: "Cierre de caja con diferencia",
      message: `La caja se cerro con una diferencia de ${mappedSession.differenceAmount}.`,
      actionUrl: "/admin/cash/history",
      metadata: {
        idCashSession: data.idCashSession,
        expectedCashAmount: mappedSession.expectedCashAmount,
        countedCashAmount: mappedSession.countedCashAmount,
        differenceAmount: mappedSession.differenceAmount,
      },
      roles: ["OWNER", "ADMIN"],
      createdByUserId: data.idUser,
    });
  }

  return {
    session: mappedSession,
    paymentSummaries: (result[1] ?? []).map(mapCashPaymentSummary),
  };
}

export async function listCashSessionsService(
  filters: CashSessionListFilters,
): Promise<PaginatedCashSessionsResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_cash_session_list(?, ?, ?, ?, ?, ?, ?, ?)",
    [
      filters.idBusiness,
      filters.limit,
      filters.offset,
      filters.idCashRegister ?? null,
      filters.idUser ?? null,
      filters.status ?? null,
      filters.startDate ?? null,
      filters.endDate ?? null,
    ],
  );
  const result = rows as unknown as [CashSessionDbRow[], TotalRecordsDbRow[]];
  const totalRecords = Number(result[1]?.[0]?.totalRecords ?? 0);

  return {
    sessions: (result[0] ?? []).map(mapCashSession),
    pagination: {
      totalRecords,
      currentPage: filters.page,
      totalPages: Math.max(Math.ceil(totalRecords / filters.limit), 1),
      limit: filters.limit,
    },
  };
}

export async function listCashSessionPaymentSummariesService(
  data: CashSessionIdPayload,
): Promise<CashSessionPaymentSummaryResponse[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_cash_session_payment_summary_list(?, ?)",
    [data.idBusiness, data.idCashSession],
  );
  const result = rows as unknown as CashPaymentSummaryDbRow[][];
  return (result[0] ?? []).map(mapCashPaymentSummary);
}
