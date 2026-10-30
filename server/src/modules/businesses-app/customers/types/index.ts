import type { Request } from "express";
import type { BusinessRequestUser } from "@/types/auth.types.js";

export type CustomerDocumentType = "DNI" | "CUIL" | "CUIT" | "PASSPORT" | "OTHER";

export interface CustomerDbRow {
  idCustomer: number;
  idBusiness: number;
  first_name: string;
  last_name: string;
  document_type: CustomerDocumentType | null;
  document_number: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  observation: string | null;
  is_active: number;
  created_at: Date;
  updated_at: Date | null;
}

export interface CustomerResponse {
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
  idBusiness: number;
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
  idBusiness: number;
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
  idBusiness: number;
  idCustomer: number;
  isActive: boolean;
}

export interface CustomerAuthenticatedRequest extends Request {
  user: BusinessRequestUser;
}
