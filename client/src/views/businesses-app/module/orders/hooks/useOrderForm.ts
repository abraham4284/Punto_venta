import { useMemo, useRef, useState } from "react";
import { useForm } from "@/hooks/useForm";
import { createOrderRequest, updateOrderRequest } from "../api/orders.api";
import { draftFromOrder, draftNumber, linesFromOrder, orderDraftTotals, orderLineTotal, orderRequestError, orderSubmissionKey, orderUnitQuantityError } from "../helpers/orders.helpers";
import { orderPayloadSchema } from "../validations/orders.validations";
import type { Order, OrderDraft, OrderDraftLine, OrderProductOption, OrderRequestError } from "../types/orders.types";

export const useOrderForm = (initial: Order | undefined, onSaved: (order: Order) => void) => {
  const { formSate: draft, setFormSate } = useForm(draftFromOrder(initial));
  const [lines, setLines] = useState<OrderDraftLine[]>(() => linesFromOrder(initial));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<OrderRequestError | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const key = useRef<{ fingerprint: string; key: string } | null>(null);
  const inFlight = useRef(false);
  const touch = () => { key.current = null; };
  const change = <K extends keyof OrderDraft>(field: K, value: OrderDraft[K]) => {
    touch(); setFormSate((current) => ({ ...current, [field]: value, ...(field === "fulfillmentType" && value === "PICKUP" ? { deliveryFee: "0" } : {}) }));
  };
  const changeLine = (id: number, field: "quantity" | "unitPrice" | "discount", value: string) => {
    touch(); setLines((current) => current.map((line) => line.idProduct === id ? { ...line, [field]: value } : line));
  };
  const removeLine = (id: number) => { touch(); setLines((current) => current.filter((line) => line.idProduct !== id)); };
  const addLine = (product: OrderProductOption) => {
    if (lines.some((line) => line.idProduct === product.idProduct) || lines.length >= 100) return;
    touch(); setLines((current) => current.some((line) => line.idProduct === product.idProduct) || current.length >= 100 ? current : [...current, { idProduct: product.idProduct, productName: product.name, barcode: product.barcode,
      unitType: product.unitType, saleMode: product.saleMode, quantity: "1", unitPrice: String(product.priceSale), discount: "0" }]);
  };
  const fee = draft.fulfillmentType === "PICKUP" ? 0 : draftNumber(draft.deliveryFee);
  const totals = useMemo(() => orderDraftTotals(lines, fee), [lines, fee]);
  const submit = async () => {
    if (inFlight.current) return;
    setError(null); setFieldErrors({});
    const result = orderPayloadSchema.safeParse({
      idCustomer: draftNumber(draft.idCustomer), idDeposit: draftNumber(draft.idDeposit), expectedPaymentMethodId: draft.expectedPaymentMethodId ? Number(draft.expectedPaymentMethodId) : null,
      fulfillmentType: draft.fulfillmentType, delivery: draft.fulfillmentType === "PICKUP" ? null : { recipientName: draft.recipientName, recipientPhone: draft.recipientPhone, address: draft.address, reference: draft.reference || null },
      deliveryFee: fee, ...totals, observation: draft.observation || null,
      items: lines.map((line) => ({ idProduct: line.idProduct, quantity: draftNumber(line.quantity), unitPrice: draftNumber(line.unitPrice), discount: draftNumber(line.discount), total: orderLineTotal(line).total })),
    });
    const issues: Record<string, string> = {};
    if (!result.success) result.error.issues.forEach((issue) => { issues[issue.path.join(".")] = issue.message; });
    lines.forEach((line, index) => { const issue = orderUnitQuantityError(line); if (issue) issues[`items.${index}.quantity`] = issue; });
    if (!result.success || Object.keys(issues).length) { setFieldErrors(issues); setError({ message: "Revisá los campos indicados antes de guardar.", errors: [] }); return; }
    inFlight.current = true; setSaving(true);
    try {
      const payload = result.data;
      let saved: Order;
      if (initial) saved = (await updateOrderRequest(initial.idOrder, payload)).data.data;
      else {
        key.current = orderSubmissionKey(key.current, payload);
        saved = (await createOrderRequest(payload, key.current.key)).data.data;
      }
      key.current = null; onSaved(saved);
    } catch (cause) {
      const failure = orderRequestError(cause); setError(failure);
      setFieldErrors(Object.fromEntries(failure.errors.map((issue) => [issue.field, issue.message])));
    } finally { inFlight.current = false; setSaving(false); }
  };
  return { draft, change, lines, addLine, removeLine, changeLine, totals, saving, error, fieldErrors, submit };
};
