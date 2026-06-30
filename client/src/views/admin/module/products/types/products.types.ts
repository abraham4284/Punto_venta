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

export interface ProductCategoryOption {
  idProductCategory: number;
  name: string;
}

export interface ProductResponse {
  idProduct: number;
  idDeposit: number;
  idBusiness: number;
  idProductCategory: number;
  categoryName: string | null;
  barcode: string | null;
  name: string;
  description: string | null;
  imageUrl: string | null;
  priceCost: number;
  priceSale: number;
  stock: number;
  stockMin: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface CreateProductPayload {
  idProductCategory: number;
  idDeposit: number;
  barcode?: string | null;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  priceCost: number;
  priceSale: number;
  stock?: number;
  stockMin?: number;
}

export interface UpdateProductPayload {
  idProductCategory?: number;
  barcode?: string | null;
  name?: string;
  description?: string | null;
  imageUrl?: string | null;
  priceCost?: number;
  priceSale?: number;
  stockMin?: number;
}

export interface UpdateProductStatusPayload {
  isActive: boolean;
}

export interface ProductFormValues {
  idProductCategory: string | null;
  idDeposit: string | null;
  barcode: string;
  name: string;
  description: string;
  imageUrl: string;
  priceCost: string;
  priceSale: string;
  stock: string;
  stockMin: string;
}

export interface ProductMetrics {
  total: number;
  minStockReached: number;
  active: number;
  inactive: number;
}
