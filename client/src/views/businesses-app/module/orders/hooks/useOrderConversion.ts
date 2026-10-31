import { useEffect, useRef, useState } from "react";
import { useForm } from "@/hooks/useForm";
import { createIdempotencyKey } from "@/helpers/idempotency.helper";
import { useSaleCashSession } from "../../sales/hooks/useSaleCashSession";
import type { PaymentMethodOption, SalePaymentInput } from "../../sales/types";
import { mapZodErrors } from "../../sales/helpers/createSale.helpers";
import { convertOrderToSaleRequest } from "../api/orders.api";
import { orderRequestError, orderSubmissionKey } from "../helpers/orders.helpers";
import { conversionErrorMessage, initialOrderPayments, orderConversionPayloadSchema, orderPaymentTotals } from "../helpers/order-conversion.helpers";
import type { ConvertOrderResult, Order } from "../types/orders.types";

export const useOrderConversion = (order: Order, methods: PaymentMethodOption[], onSaved: (result: ConvertOrderResult) => void, onRefresh: () => Promise<Order>, onProcessing: (busy: boolean) => void) => {
  const cash = useSaleCashSession();
  const [payments, setPayments] = useState(() => initialOrderPayments(order, methods));
  const { formSate: metadata, setFormSate } = useForm({ assignedToUserId: "", scheduledAt: "", observation: "" });
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const key = useRef<{ fingerprint: string; key: string } | null>(null);
  const locked = useRef(false);
  useEffect(() => { key.current = null; }, [cash.currentSession?.idCashSession]);
  const touch = () => { key.current = null; };
  const changePayment = <K extends keyof SalePaymentInput>(id: string, field: K, value: SalePaymentInput[K]) => {
    if (locked.current) return;
    touch(); setPayments((rows) => rows.map((row) => row.id === id ? { ...row, [field]: value } : row));
  };
  const totals = orderPaymentTotals(payments, order.total);
  const addPayment = () => {
    if (locked.current) return;
    touch(); setPayments((rows) => rows.length >= 5 ? rows : [...rows, { ...initialOrderPayments(order, methods)[0], id: createIdempotencyKey(), amount: String(totals.pending) }]);
  };
  const removePayment = (id: string) => {
    if (locked.current) return;
    touch(); setPayments((rows) => rows.length > 1 ? rows.filter((row) => row.id !== id) : rows);
  };
  const changeMetadata = (field: keyof typeof metadata, value: string) => {
    if (locked.current) return;
    touch(); setFormSate((current) => ({ ...current, [field]: value }));
  };
  const refreshOrder = async () => {
    setChecking(true); setNeedsRefresh(true);
    try { await onRefresh(); setNeedsRefresh(false); }
    catch { setError("No se pudo actualizar el pedido. Actualizalo antes de volver a convertir."); }
    finally { setChecking(false); }
  };
  const availableMethods = payments.every((row) => methods.some((method) => method.isActive && method.idPaymentMethod === row.idPaymentMethod));
  const blocked = saving || checking || needsRefresh || cash.loading || !cash.currentSession || order.status !== "READY" || !totals.isBalanced || !availableMethods;
  const submit = async () => {
    if (locked.current || blocked) return;
    setError(null); setErrors({});
    const scheduled = metadata.scheduledAt ? new Date(metadata.scheduledAt) : null;
    const result = orderConversionPayloadSchema.safeParse({
      idCashSession: cash.currentSession?.idCashSession,
      payments: payments.map((row) => ({ idPaymentMethod: row.idPaymentMethod, amount: row.amount.trim() ? Number(row.amount) : NaN, status: row.status, reference: row.reference || null, observation: row.observation || null })),
      delivery: order.fulfillmentType === "DELIVERY" ? { assignedToUserId: metadata.assignedToUserId ? Number(metadata.assignedToUserId) : null, scheduledAt: scheduled && !Number.isNaN(scheduled.getTime()) ? scheduled.toISOString() : metadata.scheduledAt || null, observation: metadata.observation || null } : null,
    });
    if (!result.success) { setErrors(mapZodErrors(result.error)); setError("Revisá los datos de pago y entrega indicados."); return; }
    if (order.fulfillmentType === "PICKUP" && result.data.payments.some((row) => row.status !== "CONFIRMED")) { setError("Un retiro solo admite pagos confirmados."); return; }
    locked.current = true; setSaving(true); onProcessing(true);
    try {
      key.current = orderSubmissionKey(key.current, result.data);
      const response = await convertOrderToSaleRequest(order.idOrder, result.data, key.current.key);
      key.current = null; onSaved(response.data.data);
    } catch (cause) {
      const failure = orderRequestError(cause); setError(conversionErrorMessage(failure));
      setErrors(Object.fromEntries(failure.errors.map((issue) => [issue.field, issue.message])));
      if (failure.status === 409) await refreshOrder();
    } finally { locked.current = false; setSaving(false); onProcessing(false); }
  };
  return { cash, payments, totals, metadata, saving, checking, needsRefresh, error, errors, blocked, changePayment, addPayment, removePayment, changeMetadata, submit, refreshOrder };
};
