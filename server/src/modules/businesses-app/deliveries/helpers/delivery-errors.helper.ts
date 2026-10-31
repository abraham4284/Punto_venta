const messages: Record<string, string> = {
  DELIVERY_PROVIDER_INVALID: "La asignación de proveedor no es válida.",
  DELIVERY_USER_NOT_FOUND: "Seleccioná un cadete activo del negocio.",
  DELIVERY_CANNOT_BE_ASSIGNED: "Solo se pueden asignar entregas pendientes o asignadas.",
  DELIVERY_NOT_FOUND: "Entrega no encontrada.", DELIVERY_FORBIDDEN: "No tenés permiso para operar esta entrega.",
  DELIVERY_ACTOR_NOT_FOUND: "El usuario no está habilitado en el negocio.",
  DELIVERY_INVALID_TRANSITION: "La transición de entrega no está permitida.",
  DELIVERY_FINAL_STATUS: "La entrega ya tiene un estado final.",
  DELIVERY_MUST_BE_ASSIGNED: "Asigná un proveedor antes de iniciar la entrega.",
  DELIVERY_MUST_BE_OUT_FOR_DELIVERY: "La entrega debe estar en camino para completar esta acción.",
  DELIVERY_PENDING_CASH_PAYMENT_MUST_BE_COLLECTED: "Registrá el efectivo recibido antes de confirmar la entrega.",
  THIRD_PARTY_PENDING_CASH_PAYMENT_NOT_ALLOWED: "Una entrega tercerizada no puede salir con efectivo pendiente: el tercero no participa de la rendición de Cajora.",
  DELIVERY_CANNOT_FAIL: "Solo puede marcarse fallida una entrega en camino.",
  ONLY_FAILED_DELIVERY_CAN_BE_RESCHEDULED: "Solo se pueden reagendar entregas fallidas.",
  DELIVERY_CANNOT_BE_CANCELLED: "El estado de la entrega no permite anular la venta.",
  DELIVERY_SALE_REFUND_REQUIRED: "La venta ya registra pagos cobrados o confirmados. Para revertirla se requiere una devolución/reembolso.",
  DELIVERY_SALE_WITH_PAYMENTS_CANNOT_BE_CANCELLED: "La venta ya registra pagos cobrados o confirmados. Para revertirla se requiere una devolución/reembolso.",
  DELIVERY_IN_TRANSIT_CANNOT_BE_CANCELLED: "La entrega ya está en camino. Resolvé primero su estado operativo.",
  DELIVERY_SALE_IN_PROGRESS_CANNOT_BE_CANCELLED: "La entrega ya está en camino o entregada. Revisá su estado; puede requerir una devolución/reembolso.",
  DELIVERED_SALE_RETURN_REQUIRED: "La venta ya fue entregada. Para revertirla se requiere una devolución/reembolso.",
  SALE_PAYMENT_ALREADY_SETTLED: "La venta tiene pagos rendidos. No pueden revertirse desde la anulación de la venta.",
  CLOSED_CASH_SESSION_SALE_CANNOT_BE_CANCELLED: "La venta pertenece a una caja cerrada y no puede anularse directamente.",
};
export function deliveryDomainError(error: unknown) {
  const db = error as { sqlMessage?: string; message?: string };
  const code = db?.sqlMessage ?? db?.message ?? "";
  return messages[code] ? { code, message: messages[code] } : null;
}
