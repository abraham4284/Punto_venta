import type { ProcedureCallPacket, RowDataPacket } from "mysql2";
import { Decimal } from "decimal.js";
import { pool } from "@/db/db.js";
import { safeEvaluateStockNotification } from "@/modules/notifications/services/notifications.service.js";
import { mapStockMovement, mapStockTransferHistory } from "../helpers/stock-movement.mapper.js";
import type {
  GetStockMovementsParams,
  ProcessStockAdjustmentPayload,
  ProcessStockTransferPayload,
  ProcessStockTransfersPayload,
  StockMovementCountRow,
  StockMovementDbRow,
  StockMovementsPaginatedResponse,
  StockMovementResponse,
  StockTransferBatchResponse,
  StockTransferItemResponse,
  StockTransferHistoryRow,
  StockTransferHistoryResponse,
} from "../types/index.js";

interface AppliedTransferItemRow extends RowDataPacket {
  referenceId: string | number;
  createdAt: Date;
  productName: string;
  unitType: string;
}

export async function getStockTransferByReferenceService(
  idBusiness: number,
  referenceId: number,
): Promise<StockTransferHistoryResponse | null> {
  const [rows] = await pool.query<StockTransferHistoryRow[]>(
    `SELECT sm.idStockMovement, sm.idProduct, sm.idUser, sm.idDepositFrom, sm.idDepositTo,
       sm.movement_type, sm.quantity, sm.observation, sm.created_at,
       p.name AS product_name, p.unit_type, u.name AS user_name,
       df.name AS deposit_from_name, dt.name AS deposit_to_name
     FROM stock_movements sm
     LEFT JOIN products p ON p.idBusiness = sm.idBusiness AND p.idProduct = sm.idProduct
     LEFT JOIN deposits df ON df.idBusiness = sm.idBusiness AND df.idDeposit = sm.idDepositFrom
     LEFT JOIN deposits dt ON dt.idBusiness = sm.idBusiness AND dt.idDeposit = sm.idDepositTo
     LEFT JOIN users u ON u.idUser = sm.idUser
     WHERE sm.idBusiness = ? AND sm.reference_type = 'TRANSFER' AND sm.reference_id = ?
     ORDER BY sm.idStockMovement
     LIMIT 201`,
    [idBusiness, referenceId],
  );
  return mapStockTransferHistory(referenceId, rows);
}

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

export async function processStockTransfersService(
  data: ProcessStockTransfersPayload,
): Promise<StockTransferBatchResponse> {
  const { idBusiness, idUser, idDepositFrom, idDepositTo } = data;
  const observation = data.observation || null;
  const orderedItems = [...data.items].sort(function byProduct(a, b) {
    return a.idProduct - b.idProduct;
  });
  const connection = await pool.getConnection();
  let referenceId: number | null = null;
  let createdAt: Date | undefined;
  const items: StockTransferItemResponse[] = [];
  let result: StockTransferBatchResponse;

  try {
    await connection.beginTransaction();
    for (const item of orderedItems) {
      const [rows] = await connection.query<ProcedureCallPacket<AppliedTransferItemRow[]>>(
        "CALL sp_apply_stock_transfer_item(?, ?, ?, ?, ?, ?, ?, ?, TRUE)",
        [idBusiness, idUser, item.idProduct, idDepositFrom, idDepositTo,
          new Decimal(item.quantity).toFixed(2), observation, referenceId],
      );
      const applied = rows[0]?.[0];
      const appliedReference: number = Number(applied?.referenceId);
      if (!applied || !Number.isSafeInteger(appliedReference) || appliedReference <= 0 ||
          (referenceId !== null && referenceId !== appliedReference)) {
        throw new Error("Resultado inesperado al aplicar transferencia de stock");
      }
      referenceId = appliedReference;
      createdAt ??= applied.createdAt;
      items.push({
        ...item,
        productName: applied.productName,
        unitType: applied.unitType,
      });
    }

    if (referenceId === null || createdAt === undefined) {
      throw new Error("La transferencia no contiene movimientos");
    }
    const totalQuantity = items.reduce(function sum(total, item) {
      return total.plus(item.quantity);
    }, new Decimal(0));
    result = {
      referenceId, idDepositFrom, idDepositTo, idUser, createdAt, observation, items,
      totalQuantity: totalQuantity.toNumber(),
      movementCount: items.length * 2,
    };
    await connection.commit();
  } catch (error) {
    try {
      await connection.rollback();
    } catch (rollbackError) {
      connection.destroy();
      console.error("Error al revertir transferencia de stock", rollbackError);
    }
    throw error;
  } finally {
    connection.release();
  }

  for (const item of items) {
    await Promise.allSettled([
      safeEvaluateStockNotification({ idBusiness, idProduct: item.idProduct, idDeposit: idDepositFrom }),
      safeEvaluateStockNotification({ idBusiness, idProduct: item.idProduct, idDeposit: idDepositTo }),
    ]);
  }
  return result;
}
