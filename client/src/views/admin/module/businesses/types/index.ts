export interface FieldError {
  field: string;
  message: string;
}

export interface ApiResponse<T> {
  status: boolean | string;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  status: boolean | string;
  message: string;
  errors?: FieldError[];
}

export type BusinessType = "FINANCIERA";

export interface BusinessResponse {
  idBusiness: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  businessType: BusinessType | string | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface UpdateBusinessBody {
  name: string;
  slug: string;
  logoUrl: string | null;
  businessType: BusinessType;
}

export interface BusinessFormValues {
  name: string;
  slug: string;
  logoUrl: string;
  businessType: BusinessType;
}
