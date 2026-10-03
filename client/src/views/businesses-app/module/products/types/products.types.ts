import type { ProductRichContent } from "./product-rich-content.types";

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

export interface ProductsPagination {
  page: number;
  currentPage: number;
  limit: number;
  total: number;
  totalRecords: number;
  totalPages: number;
}

export interface ProductsListResponse {
  items: ProductResponse[];
  pagination: ProductsPagination;
}

export interface ProductsQueryParams {
  page?: number;
  limit?: number;
  search?: string | null;
  idProductCategory?: number | null;
  isActive?: boolean | null;
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

export const PRODUCT_SALE_MODES = ["stock", "on_order"] as const;

export type ProductSaleMode = (typeof PRODUCT_SALE_MODES)[number];

export const PRODUCT_UNIT_TYPE_OPTIONS: {
  value: ProductUnitType;
  label: string;
  shortLabel: string;
}[] = [
  { value: "UNIT", label: "Unidad", shortLabel: "u." },
  { value: "KG", label: "Kilogramo", shortLabel: "kg" },
  { value: "GRAM", label: "Gramo", shortLabel: "g" },
  { value: "LITER", label: "Litro", shortLabel: "l" },
  { value: "METER", label: "Metro", shortLabel: "m" },
];

export const PRODUCT_SALE_MODE_OPTIONS: {
  value: ProductSaleMode;
  label: string;
  description: string;
}[] = [
  {
    value: "stock",
    label: "Venta con stock",
    description: "Disponibilidad segun stock del deposito principal.",
  },
  {
    value: "on_order",
    label: "Por encargo",
    description: "El catalogo mostrara el producto como disponible por encargo.",
  },
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
  slug: string;
  description: string | null;
  imageUrl: string | null;
  priceCost: number;
  priceSale: number;
  priceWholesale?: number | null;
  unitType: ProductUnitType;
  saleMode: ProductSaleMode;
  availabilityNote: string | null;
  stock: number;
  stockMin: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface ProductDetailResponse extends ProductResponse {
  richContent: ProductRichContent | null;
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
  saleMode?: ProductSaleMode;
  availabilityNote?: string | null;
  initialStock: number;
  stockMin?: number;
  richContent?: ProductRichContent | null;
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
  saleMode?: ProductSaleMode;
  availabilityNote?: string | null;
  stockMin?: number;
  richContent?: ProductRichContent | null;
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
  priceWholesale: string;
  unitType: ProductUnitType;
  saleMode: ProductSaleMode;
  availabilityNote: string;
  stock: string;
  stockMin: string;
}

export interface ProductMetrics {
  total: number;
  minStockReached: number;
  active: number;
  inactive: number;
}
