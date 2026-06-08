export interface FieldError {
  field: string;
  message: string;
}

export interface ApiResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  status: boolean;
  message: string;
  errors?: FieldError[];
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

export interface DepositFormValues {
  name: string;
  description: string;
  isDefault: boolean;
}

export interface DepositMetrics {
  total: number;
  active: number;
  inactive: number;
  defaultDepositName: string;
}