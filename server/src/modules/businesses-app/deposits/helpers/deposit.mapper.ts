import type { DepositDbRow, DepositResponse } from "../types/deposit.types.js";

export function mapDeposit(deposit: DepositDbRow): DepositResponse {
  return {
    idDeposit: deposit.idDeposit,
    idBusiness: deposit.idBusiness,
    name: deposit.name,
    description: deposit.description,
    isDefault: Boolean(deposit.is_default),
    isActive: Boolean(deposit.is_active),
    createdAt: deposit.created_at,
    updatedAt: deposit.updated_at,
  };
}
