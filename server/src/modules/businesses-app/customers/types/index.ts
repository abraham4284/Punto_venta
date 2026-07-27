import type { Request } from "express";
import type { BusinessRequestUser } from "@/types/auth.types.js";

export interface CustomerDbRow {
  idCustomer: number;
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

export interface CustomerResponse {
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
  idBusiness: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  observation?: string | null;
}

export interface UpdateCustomerPayload {
  idBusiness: number;
  idCustomer: number;
  name?: string;
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
