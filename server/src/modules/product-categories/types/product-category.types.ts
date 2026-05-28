export interface ProductCategoryDbRow {
  idProductCategory: number;
  idBusiness: number;
  name: string;
  description: string | null;
  is_default: number;
  is_active: number;
  created_at: Date;
  updated_at: Date | null;
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

export interface ProductCategoryIdParams {
  idProductCategory: string;
}
