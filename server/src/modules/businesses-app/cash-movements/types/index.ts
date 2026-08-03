export type CashMovementType = "INCOME" | "EXPENSE";

export interface CashMovementDbRow {
  idCashMovement: number;
  idBusiness: number;
  idCashSession: number;
  idUser: number;
  userName: string;
  movement_type: CashMovementType;
  category: string;
  amount: string | number;
  description: string | null;
  created_at: Date;
}

export interface CashMovementResponse {
  idCashMovement: number;
  idBusiness: number;
  idCashSession: number;
  idUser: number;
  userName: string;
  movementType: CashMovementType;
  category: string;
  amount: number;
  description: string | null;
  createdAt: Date;
}

export interface CreateCashMovementPayload {
  idBusiness: number;
  idCashSession: number;
  idUser: number;
  movementType: CashMovementType;
  category: string;
  amount: number;
  description?: string | null;
}

export interface CashMovementIdPayload {
  idBusiness: number;
  idCashMovement: number;
}

export interface CashMovementSessionPayload {
  idBusiness: number;
  idCashSession: number;
}
