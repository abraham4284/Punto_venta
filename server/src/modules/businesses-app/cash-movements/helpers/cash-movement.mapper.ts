import type {
  CashMovementDbRow,
  CashMovementResponse,
} from "../types/index.js";

export function mapCashMovement(row: CashMovementDbRow): CashMovementResponse {
  return {
    idCashMovement: row.idCashMovement,
    idBusiness: row.idBusiness,
    idCashSession: row.idCashSession,
    idUser: row.idUser,
    userName: row.userName,
    movementType: row.movement_type,
    category: row.category,
    amount: Number(row.amount),
    description: row.description,
    createdAt: row.created_at,
  };
}
