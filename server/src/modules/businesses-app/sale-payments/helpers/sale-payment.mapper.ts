import type {
  SalePaymentDbRow,
  SalePaymentEventDbRow,
  SalePaymentEventResponse,
  SalePaymentResponse,
  JsonValue,
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

function parseMetadata(metadata: SalePaymentEventDbRow["metadata"]): JsonValue | null {
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

export function mapSalePayment(row: SalePaymentDbRow): SalePaymentResponse {
  return {
    idSalePayment: row.idSalePayment,
    idBusiness: row.idBusiness,
    idSale: row.idSale,
    idPaymentMethod: row.idPaymentMethod,
    paymentMethodCode: row.payment_method_code,
    paymentMethodName: row.payment_method_name,
    affectsCash: Boolean(row.affects_cash),
    amount: Number(row.amount),
    status: row.status,
    idCashSession: row.idCashSession,
    idCashSettlement: row.idCashSettlement,
    reference: row.reference,
    observation: row.observation,
    createdAt: row.created_at,
    collectedAt: row.collected_at,
    confirmedAt: row.confirmed_at,
    cancelledAt: row.cancelled_at,
  };
}

export function mapSalePaymentEvent(
  row: SalePaymentEventDbRow,
): SalePaymentEventResponse {
  return {
    idSalePaymentEvent: row.idSalePaymentEvent,
    idBusiness: row.idBusiness,
    idSalePayment: row.idSalePayment,
    eventType: row.event_type,
    previousStatus: row.previous_status,
    newStatus: row.new_status,
    metadata: parseMetadata(row.metadata),
    createdByUserId: row.created_by_user_id,
    createdByUserName: row.created_by_user_name,
    createdAt: row.created_at,
  };
}
