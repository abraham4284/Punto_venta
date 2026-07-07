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

export const BUSINESS_TYPE_VALUES = [
  "MAXIKIOSCO",
  "PRODUCTOS",
  "FINANCIERA",
  "KIOSCO",
  "ALMACEN",
  "MINIMERCADO",
  "SUPERMERCADO",
  "FARMACIA",
  "FERRETERIA",
  "INDUMENTARIA",
  "TECNOLOGIA",
  "DISTRIBUIDORA",
  "GASTRONOMIA",
  "LIBRERIA",
  "PERFUMERIA",
  "VETERINARIA",
  "OTRO",
] as const;

export type BusinessType = (typeof BUSINESS_TYPE_VALUES)[number];

export const BUSINESS_TYPE_OPTIONS: { value: BusinessType; label: string }[] = [
  { value: "MAXIKIOSCO", label: "Maxikiosco" },
  { value: "PRODUCTOS", label: "Venta de productos" },
  { value: "KIOSCO", label: "Kiosco" },
  { value: "ALMACEN", label: "Almacen / Despensa" },
  { value: "MINIMERCADO", label: "Minimercado" },
  { value: "SUPERMERCADO", label: "Supermercado" },
  { value: "FARMACIA", label: "Farmacia" },
  { value: "FERRETERIA", label: "Ferreteria" },
  { value: "INDUMENTARIA", label: "Indumentaria" },
  { value: "TECNOLOGIA", label: "Tecnologia" },
  { value: "DISTRIBUIDORA", label: "Distribuidora" },
  { value: "GASTRONOMIA", label: "Gastronomia" },
  { value: "LIBRERIA", label: "Libreria" },
  { value: "PERFUMERIA", label: "Perfumeria" },
  { value: "VETERINARIA", label: "Veterinaria" },
  { value: "OTRO", label: "Otro rubro" },
];

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
