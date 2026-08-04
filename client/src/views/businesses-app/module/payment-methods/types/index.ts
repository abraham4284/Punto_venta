export type PaymentMethodCode = "CASH" | "TRANSFER" | "CARD" | "OTHER";

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

export interface PaymentMethodResponse {
  idPaymentMethod: number;
  idBusiness: number;
  code: PaymentMethodCode;
  name: string;
  affectsCash: boolean;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  salesCount: number;
}

export interface CreatePaymentMethodBody {
  code: Exclude<PaymentMethodCode, "CASH">;
  name: string;
}

export interface UpdatePaymentMethodBody {
  name: string;
}

export interface ChangePaymentMethodStatusBody {
  isActive: boolean;
}

export interface PaymentMethodFormValues {
  code: Exclude<PaymentMethodCode, "CASH">;
  name: string;
}

export type MutationResult = {
  status: boolean;
  message: string;
  errors?: FieldError[];
};
