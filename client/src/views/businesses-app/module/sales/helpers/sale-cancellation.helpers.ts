import type { SaleResponse, SaleWithDetailsResponse } from "../types";
const refund = "La venta ya registra pagos cobrados o confirmados. Para revertirla se requiere una devolución/reembolso.";
const transit = "La entrega ya está en camino. Resolvé primero su estado operativo.";
const delivered = "La venta ya fue entregada. Para revertirla se requiere una devolución/reembolso.";
const settled = "La venta tiene pagos rendidos. No pueden revertirse desde la anulación de la venta.";
export const saleCancellationReason = (sale: Pick<SaleResponse, "status" | "deliveryStatus" | "confirmedAmount" | "collectedAmount"> & Partial<Pick<SaleWithDetailsResponse, "delivery" | "payments">>): string | null => {
  if (sale.status === "CANCELLED") return "La venta ya está anulada.";
  const status = sale.delivery?.status ?? sale.deliveryStatus;
  if (status === "OUT_FOR_DELIVERY") return transit;
  if (status === "DELIVERED") return delivered;
  if (sale.payments?.some((payment) => payment.idCashSettlement != null)) return settled;
  if (status && (sale.confirmedAmount > 0 || sale.collectedAmount > 0 || sale.payments?.some((payment) => payment.status === "CONFIRMED" || payment.status === "COLLECTED"))) return refund;
  if (status && !["PENDING", "ASSIGNED", "FAILED"].includes(status)) return "El estado de la entrega no permite anular la venta.";
  return null;
};
export const saleCancellationError = (message: string | undefined) => {
  const messages: Record<string, string> = {
    DELIVERY_SALE_REFUND_REQUIRED: refund, DELIVERY_SALE_WITH_PAYMENTS_CANNOT_BE_CANCELLED: refund,
    DELIVERY_IN_TRANSIT_CANNOT_BE_CANCELLED: transit, DELIVERY_SALE_IN_PROGRESS_CANNOT_BE_CANCELLED: "La entrega está en camino o entregada. Revisá su estado antes de revertir la venta.",
    DELIVERED_SALE_RETURN_REQUIRED: delivered, SALE_PAYMENT_ALREADY_SETTLED: settled,
    CLOSED_CASH_SESSION_SALE_CANNOT_BE_CANCELLED: "La caja de la venta está cerrada; no puede anularse directamente.",
  };
  return message && messages[message] ? messages[message] : !message || /^[A-Z][A-Z0-9_]+$/.test(message) ? "No se pudo anular la venta. Actualizá su estado antes de reintentar." : message;
};
