import { Decimal } from "decimal.js";
import type {
  StockMovementDbRow,
  StockMovementResponse,
  StockTransferHistoryResponse,
  StockTransferHistoryRow,
} from "../types/index.js";

export function mapStockMovement(
  movement: StockMovementDbRow,
): StockMovementResponse {
  return {
    idStockMovement: movement.idStockMovement,
    idBusiness: movement.idBusiness,
    businessName: movement.business_name,
    idProduct: movement.idProduct,
    productName: movement.product_name,
    productImageUrl: movement.product_image_url,
    idUser: movement.idUser,
    userName: movement.user_name,
    movementType: movement.movement_type,
    idDepositFrom: movement.idDepositFrom,
    depositFromName: movement.deposit_from_name,
    idDepositTo: movement.idDepositTo,
    depositToName: movement.deposit_to_name,
    quantity: Number(movement.quantity),
    referenceType: movement.reference_type,
    referenceId: movement.reference_id,
    observation: movement.observation,
    createdAt: movement.created_at,
  };
}

export function mapStockTransferHistory(
  referenceId: number,
  rows: StockTransferHistoryRow[],
): StockTransferHistoryResponse | null {
  if (rows.length === 0) return null;
  const inconsistent = new Error("Grupo de transferencia inconsistente");
  const first = rows[0];
  if (
    rows.length > 200 || rows.length % 2 !== 0 ||
    first.idStockMovement !== referenceId || first.movement_type !== "TRANSFER_OUT" ||
    !first.idDepositFrom || !first.idDepositTo || first.idDepositFrom === first.idDepositTo ||
    !Number.isFinite(first.created_at?.getTime())
  ) {
    throw inconsistent;
  }
  const outgoing = new Map<number, StockTransferHistoryRow>();
  const incoming = new Map<number, StockTransferHistoryRow>();

  for (const row of rows) {
    if (
      row.idDepositFrom !== first.idDepositFrom || row.idDepositTo !== first.idDepositTo ||
      row.idUser !== first.idUser || row.observation !== first.observation
    ) {
      throw inconsistent;
    }
    const direction = row.movement_type === "TRANSFER_OUT" ? outgoing
      : row.movement_type === "TRANSFER_IN" ? incoming : null;
    if (!direction || direction.has(row.idProduct)) throw inconsistent;
    direction.set(row.idProduct, row);
  }

  if (outgoing.size !== incoming.size) throw inconsistent;
  const items = [...outgoing.values()].map(function item(row) {
    const counterpart = incoming.get(row.idProduct);
    const quantity = new Decimal(row.quantity);
    if (!counterpart || !quantity.isFinite() || !quantity.gt(0) || !quantity.eq(counterpart.quantity)) {
      throw inconsistent;
    }
    return {
      idProduct: row.idProduct,
      productName: row.product_name?.trim() || `Producto #${row.idProduct}`,
      unitType: row.unit_type?.trim() || "—",
      quantity: quantity.toNumber(),
    };
  });

  return {
    referenceId,
    idDepositFrom: first.idDepositFrom,
    depositFromName: first.deposit_from_name?.trim() || `Depósito #${first.idDepositFrom}`,
    idDepositTo: first.idDepositTo,
    depositToName: first.deposit_to_name?.trim() || `Depósito #${first.idDepositTo}`,
    idUser: first.idUser,
    userName: first.user_name?.trim() || `Usuario #${first.idUser}`,
    createdAt: first.created_at,
    observation: first.observation,
    items,
    movementCount: rows.length,
  };
}
