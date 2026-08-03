export interface CashRegisterDbRow {
  idCashRegister: number;
  idBusiness: number;
  name: string;
  description: string | null;
  is_default: number;
  is_active: number;
  has_open_session: number;
  created_at: Date;
  updated_at: Date;
}

export interface CashRegisterResponse {
  idCashRegister: number;
  idBusiness: number;
  name: string;
  description: string | null;
  isDefault: boolean;
  isActive: boolean;
  hasOpenSession: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCashRegisterPayload {
  idBusiness: number;
  name: string;
  description?: string | null;
  isDefault?: boolean;
}

export interface UpdateCashRegisterPayload extends CreateCashRegisterPayload {
  idCashRegister: number;
}

export interface ChangeCashRegisterStatusPayload {
  idBusiness: number;
  idCashRegister: number;
  isActive: boolean;
}

export interface CashRegisterIdPayload {
  idBusiness: number;
  idCashRegister: number;
}
