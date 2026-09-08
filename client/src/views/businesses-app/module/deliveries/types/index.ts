export type DeliveryStatus =
  | "PENDING"
  | "ASSIGNED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "FAILED"
  | "CANCELLED";

export type JsonValue =
  | null
  | string
  | number
  | boolean
  | JsonValue[]
  | { [key: string]: JsonValue };

export type DeliveryEventType =
  | "DELIVERY_CREATED"
  | "DELIVERY_ASSIGNED"
  | "DELIVERY_UNASSIGNED"
  | "DELIVERY_OUT_FOR_DELIVERY"
  | "DELIVERY_FAILED"
  | "DELIVERY_RESCHEDULED"
  | "DELIVERY_DELIVERED"
  | "DELIVERY_CANCELLED";

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

export type DeliveryUserOption = {
  idUser: number;
  name: string;
  username: string;
};

export type DeliveryEventResponse = {
  idDeliveryEvent: number;
  idBusiness: number;
  idSaleDelivery: number;
  eventType: DeliveryEventType;
  previousStatus: DeliveryStatus | null;
  newStatus: DeliveryStatus | null;
  metadata: JsonValue | null;
  createdByUserId: number | null;
  createdByUserName: string | null;
  createdAt: string;
};
