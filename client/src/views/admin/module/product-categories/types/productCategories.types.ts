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

export interface FieldError {
  field: string;
  message: string;
}

export interface ProductCategoryResponse {
  idProductCategory: number;
  idBusiness: number;
  name: string;
  description: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface CreateProductCategoryBody {
  name: string;
  description?: string | null;
  isDefault?: boolean;
}

export interface UpdateProductCategoryBody {
  name?: string;
  description?: string | null;
  isDefault?: boolean;
}

export interface UpdateProductCategoryStatusBody {
  isActive: boolean;
}

export interface ProductCategoryFormValues {
  name: string;
  description: string;
  isDefault: boolean;
}

export interface ProductCategoryMetrics {
  total: number;
  active: number;
  inactive: number;
}