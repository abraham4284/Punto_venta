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

export const PRODUCT_UNIT_TYPES = [
  "UNIT",
  "KG",
  "GRAM",
  "LITER",
  "METER",
] as const;

export type ProductUnitType = (typeof PRODUCT_UNIT_TYPES)[number];

export const PRODUCT_UNIT_TYPE_OPTIONS: {
  value: ProductUnitType;
  label: string;
  shortLabel: string;
}[] = [
  { value: "UNIT", label: "Unidad", shortLabel: "u." },
  { value: "KG", label: "Kilogramo", shortLabel: "kg" },
  { value: "LITER", label: "Litro", shortLabel: "l" },
  { value: "METER", label: "Metro", shortLabel: "m" },
];

export interface ProductResponse {
  idProduct: number;
  idDeposit: number;
  idBusiness: number;
  idProductCategory: number;
  categoryName: string | null;
  productCategoryName: string | null;
  barcode: string | null;
  name: string;
  description: string | null;
  imageUrl: string | null;
  priceCost: number;
  priceSale: number;
  priceWholesale?: number | null;
  unitType: ProductUnitType;
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
  priceWholesale?: number | null;
  unitType: ProductUnitType;
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
  priceWholesale?: number | null;
  unitType?: ProductUnitType;
  stockMin?: number;
}

export interface UpdateProductPricesPayload {
  priceCost: number;
  priceSale: number;
  priceWholesale?: number | null;
}

export interface ProductPricesFormValues {
  priceCost: string;
  priceSale: string;
  priceWholesale: string;
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
  unitType: ProductUnitType;
  stock: string;
  stockMin: string;
}

export interface ProductMetrics {
  total: number;
  minStockReached: number;
  active: number;
  inactive: number;
}
