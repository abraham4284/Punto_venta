export interface Customer {
  idCustomer: number;
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

export interface CreateCustomerPayload {
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  observation?: string | null;
}

export interface UpdateCustomerPayload {
  idCustomer: number;
  name?: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  observation?: string | null;
}

export interface ToggleCustomerStatusPayload {
  idCustomer: number;
  isActive: boolean;
}

export interface CustomerFormValues {
  name: string;
  phone: string;
  email: string;
  address: string;
  observation: string;
}

export interface CustomerMetrics {
  total: number;
  active: number;
  inactive: number;
}