import type {
  PaymentMethodDbRow,
  PaymentMethodResponse,
} from "../types/index.js";

export function mapPaymentMethod(
  paymentMethod: PaymentMethodDbRow,
): PaymentMethodResponse {
  return {
    idPaymentMethod: paymentMethod.idPaymentMethod,
    idBusiness: paymentMethod.idBusiness,
    code: paymentMethod.code,
    name: paymentMethod.name,
    affectsCash: Boolean(paymentMethod.affects_cash),
    isDefault: Boolean(paymentMethod.is_default),
    isActive: Boolean(paymentMethod.is_active),
    createdAt: paymentMethod.created_at,
    salesCount: Number(paymentMethod.sales_count ?? 0),
  };
}
