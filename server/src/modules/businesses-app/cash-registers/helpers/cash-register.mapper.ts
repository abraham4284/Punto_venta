import type {
  CashRegisterDbRow,
  CashRegisterResponse,
} from "../types/index.js";

export function mapCashRegister(row: CashRegisterDbRow): CashRegisterResponse {
  return {
    idCashRegister: row.idCashRegister,
    idBusiness: row.idBusiness,
    name: row.name,
    description: row.description,
    isDefault: Boolean(row.is_default),
    isActive: Boolean(row.is_active),
    hasOpenSession: Boolean(row.has_open_session),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
