import type { DeliveryDbRow, DeliveryResponse } from "../types/index.js";

export function mapDelivery(row: DeliveryDbRow): DeliveryResponse {
  return {
    idSaleDelivery: row.idSaleDelivery,
    idBusiness: row.idBusiness,
    idSale: row.idSale,
    saleNumber: row.sale_number,
    total: Number(row.total),
    assignedToUserId: row.assigned_to_user_id,
    assignedUserName: row.assigned_user_name,
    createdByUserId: row.created_by_user_id,
    createdByUserName: row.created_by_user_name,
    status: row.status,
    recipientName: row.recipient_name,
    recipientPhone: row.recipient_phone,
    deliveryAddress: row.delivery_address,
    deliveryReference: row.delivery_reference,
    scheduledAt: row.scheduled_at,
    assignedAt: row.assigned_at,
    outForDeliveryAt: row.out_for_delivery_at,
    deliveredAt: row.delivered_at,
    failedAt: row.failed_at,
    cancelledAt: row.cancelled_at,
    failureReason: row.failure_reason,
    observation: row.observation,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
