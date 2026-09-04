import type { Request } from "express";
import type { BusinessRequestUser } from "@/types/auth.types.js";

export type DeliveryStatus =
  | "PENDING"
  | "ASSIGNED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "FAILED"
  | "CANCELLED";

export interface DeliveryDbRow {
  idSaleDelivery: number;
  idBusiness: number;
  idSale: number;
  sale_number: string;
  total: string | number;
  assigned_to_user_id: number | null;
  assigned_user_name: string | null;
  created_by_user_id: number;
  created_by_user_name: string | null;
  status: DeliveryStatus;
  recipient_name: string;
  recipient_phone: string | null;
  delivery_address: string;
  delivery_reference: string | null;
  scheduled_at: Date | null;
  assigned_at: Date | null;
  out_for_delivery_at: Date | null;
  delivered_at: Date | null;
  failed_at: Date | null;
  cancelled_at: Date | null;
  failure_reason: string | null;
  observation: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface DeliveryResponse {
  idSaleDelivery: number;
  idBusiness: number;
  idSale: number;
  saleNumber: string;
  total: number;
  assignedToUserId: number | null;
  assignedUserName: string | null;
  createdByUserId: number;
  createdByUserName: string | null;
  status: DeliveryStatus;
  recipientName: string;
  recipientPhone: string | null;
  deliveryAddress: string;
  deliveryReference: string | null;
  scheduledAt: Date | null;
  assignedAt: Date | null;
  outForDeliveryAt: Date | null;
  deliveredAt: Date | null;
  failedAt: Date | null;
  cancelledAt: Date | null;
  failureReason: string | null;
  observation: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliveryListFilters {
  idBusiness: number;
  page: number;
  limit: number;
  offset: number;
  status?: DeliveryStatus | null;
  assignedToUserId?: number | null;
  search?: string | null;
}

export interface DeliveryPagination {
  totalRecords: number;
  currentPage: number;
  totalPages: number;
  limit: number;
}

export interface PaginatedDeliveriesResponse {
  deliveries: DeliveryResponse[];
  pagination: DeliveryPagination;
}

export interface DeliveryActionPayload {
  idBusiness: number;
  idSaleDelivery: number;
  idUser: number;
  assignedToUserId?: number | null;
  status?: DeliveryStatus;
  scheduledAt?: Date | null;
  failureReason?: string | null;
  observation?: string | null;
}

export interface TotalRecordsDbRow {
  totalRecords: number;
}

export interface DeliveryAuthenticatedRequest extends Request {
  user: BusinessRequestUser;
}
