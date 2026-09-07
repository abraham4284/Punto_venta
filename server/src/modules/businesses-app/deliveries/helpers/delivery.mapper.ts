import type {
  DeliveryDbRow,
  DeliveryEventDbRow,
  DeliveryEventResponse,
  JsonValue,
  DeliveryResponse,
} from "../types/index.js";

function isJsonValue(value: unknown): value is JsonValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(isJsonValue);
  }

  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).every(isJsonValue);
  }

  return false;
}

function parseMetadata(metadata: DeliveryEventDbRow["metadata"]): JsonValue | null {
  if (metadata === null) {
    return null;
  }

  if (Buffer.isBuffer(metadata)) {
    return parseMetadata(metadata.toString("utf8"));
  }

  if (typeof metadata === "string") {
    try {
      const parsed = JSON.parse(metadata) as unknown;
      return isJsonValue(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  return isJsonValue(metadata) ? metadata : null;
}

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

export function mapDeliveryEvent(row: DeliveryEventDbRow): DeliveryEventResponse {
  return {
    idDeliveryEvent: row.idDeliveryEvent,
    idBusiness: row.idBusiness,
    idSaleDelivery: row.idSaleDelivery,
    eventType: row.event_type,
    previousStatus: row.previous_status,
    newStatus: row.new_status,
    metadata: parseMetadata(row.metadata),
    createdByUserId: row.created_by_user_id,
    createdByUserName: row.created_by_user_name,
    createdAt: row.created_at,
  };
}
