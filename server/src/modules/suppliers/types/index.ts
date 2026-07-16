export interface SupplierDbRow {
  idSupplier: number;
  idBusiness: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  observation: string | null;
  is_active: number;
  created_at: Date;
  updated_at: Date | null;
}

export interface Supplier {
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

export interface CreateSupplierInput {
  idBusiness: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  observation?: string | null;
}

export interface UpdateSupplierInput {
  idSupplier: number;
  idBusiness: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  observation?: string | null;
  isActive: boolean;
}
