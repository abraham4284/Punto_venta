export interface FieldError {
  field: string;
  message: string;
}

export interface ApiErrorResponse {
  status: boolean;
  message: string;
  errors?: FieldError[];
}

export interface ApiResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

export interface SupplierResponse {
  idSupplier: number;
  idBusiness: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  observation: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface CreateSupplierBody {
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  observation?: string | null;
}

export interface UpdateSupplierBody {
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  observation?: string | null;
  isActive: boolean;
}

export interface SupplierFormValues {
  name: string;
  phone: string;
  email: string;
  address: string;
  observation: string;
}
