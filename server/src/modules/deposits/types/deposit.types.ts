export interface DepositDbRow {
  idDeposit: number;
  idBusiness: number;
  name: string;
  description: string | null;
  is_default: number;
  is_active: number;
  created_at: Date;
  updated_at: Date | null;
}

export interface DepositResponse {
  idDeposit: number;
  idBusiness: number;
  name: string;
  description: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface CreateDepositBody {
  name: string;
  description?: string | null;
  isDefault?: boolean;
}

export interface UpdateDepositBody {
  name?: string;
  description?: string | null;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface DepositIdParams {
  idDeposit: string;
}
