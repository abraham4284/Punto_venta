export type CustomerDocumentType = "DNI" | "CUIL" | "CUIT" | "PASSPORT" | "OTHER";

export interface Customer {
  idCustomer: number;
  idBusiness: number;
  firstName: string;
  lastName: string;
  fullName: string;
  documentType: CustomerDocumentType | null;
  documentNumber: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  observation: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface CreateCustomerPayload {
  firstName: string;
  lastName: string;
  documentType?: CustomerDocumentType | null;
  documentNumber?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  observation?: string | null;
}

export interface UpdateCustomerPayload {
  idCustomer: number;
  firstName?: string;
  lastName?: string;
  documentType?: CustomerDocumentType | null;
  documentNumber?: string | null;
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
  firstName: string;
  lastName: string;
  documentType: CustomerDocumentType | "";
  documentNumber: string;
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
