export type DeliveryStatus =
  | "PENDING"
  | "ASSIGNED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "FAILED"
  | "CANCELLED";

export type DeliveryResponse = {
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
  scheduledAt: string | null;
  assignedAt: string | null;
  outForDeliveryAt: string | null;
  deliveredAt: string | null;
  failedAt: string | null;
  cancelledAt: string | null;
  failureReason: string | null;
  observation: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DeliveryFilters = {
  search: string;
  status: DeliveryStatus | "";
  assignedToUserId: number | null;
};

export type DeliveryPagination = {
  totalRecords: number;
  currentPage: number;
  totalPages: number;
  limit: number;
};

export type PaginatedDeliveriesResponse = {
  deliveries: DeliveryResponse[];
  pagination: DeliveryPagination;
};

export type DeliveryActionBody = {
  assignedToUserId?: number | null;
  scheduledAt?: string | null;
  failureReason?: string | null;
  observation?: string | null;
};
