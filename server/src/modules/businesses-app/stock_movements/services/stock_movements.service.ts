import type { RowDataPacket } from "mysql2";
import { pool } from "@/db/db.js";
import { safeEvaluateStockNotification } from "@/modules/notifications/services/notifications.service.js";
import { mapStockMovement } from "../helpers/stock-movement.mapper.js";
import type {
  GetStockMovementsParams,
  ProcessStockAdjustmentPayload,
  ProcessStockTransferPayload,
  StockMovementCountRow,
  StockMovementDbRow,
  StockMovementsPaginatedResponse,
  StockMovementResponse,
} from "../types/index.js";

export async function getStockMovementsService(
  params: GetStockMovementsParams,
): Promise<StockMovementsPaginatedResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_get_stock_movements(?, ?, ?, ?, ?, ?)",
    [
      params.idBusiness,
      params.limit,
      params.offset,
      params.movementType ?? null,
      params.idDeposit ?? null,
      params.search ?? null,
    ],
  );

  const result = rows as unknown as [
    StockMovementDbRow[],
    StockMovementCountRow[],
  ];
  const movements = (result[0] ?? []).map(mapStockMovement);
  const totalRecords = Number(result[1]?.[0]?.totalRecords ?? 0);
  const currentPage = Math.floor(params.offset / params.limit) + 1;

  return {
    movements,
    pagination: {
      totalRecords,
      currentPage,
      totalPages: Math.ceil(totalRecords / params.limit),
      limit: params.limit,
    },
  };
}

export async function processStockAdjustmentService(
  data: ProcessStockAdjustmentPayload,
): Promise<StockMovementResponse[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_process_stock_adjustment(?, ?, ?, ?, ?, ?, ?)",
    [
      data.idBusiness,
      data.idUser,
      data.idProduct,
      data.idDeposit,
      data.quantity,
      data.type,
      data.observation ?? null,
    ],
  );

  const result = rows as unknown as StockMovementDbRow[][];
  await safeEvaluateStockNotification({
    idBusiness: data.idBusiness,
    idProduct: data.idProduct,
    idDeposit: data.idDeposit,
  });

  return (result[0] ?? []).map(mapStockMovement);
}

export async function processStockTransferService(
  data: ProcessStockTransferPayload,
): Promise<StockMovementResponse[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_process_stock_transfer(?, ?, ?, ?, ?, ?, ?)",
    [
      data.idBusiness,
      data.idUser,
      data.idProduct,
      data.idDepositFrom,
      data.idDepositTo,
      data.quantity,
      data.observation ?? null,
    ],
  );

  const result = rows as unknown as StockMovementDbRow[][];
  await safeEvaluateStockNotification({
    idBusiness: data.idBusiness,
    idProduct: data.idProduct,
    idDeposit: data.idDepositFrom,
  });
  await safeEvaluateStockNotification({
    idBusiness: data.idBusiness,
    idProduct: data.idProduct,
    idDeposit: data.idDepositTo,
  });

  return (result[0] ?? []).map(mapStockMovement);
}
