import type { PaymentMethodCode } from "../types";

export const paymentMethodTypeLabels: Record<PaymentMethodCode, string> = {
  CASH: "Efectivo",
  TRANSFER: "Transferencia",
  CARD: "Tarjeta",
  OTHER: "Otro",
};

export const customPaymentMethodTypeOptions: {
  value: Exclude<PaymentMethodCode, "CASH">;
  label: string;
  description: string;
}[] = [
  {
    value: "TRANSFER",
    label: "Transferencia",
    description: "Billeteras virtuales, bancos o cuentas digitales.",
  },
  {
    value: "CARD",
    label: "Tarjeta",
    description: "Posnet, credito, debito o procesadores similares.",
  },
  {
    value: "OTHER",
    label: "Otro",
    description: "Cuentas corrientes u otros medios no incluidos.",
  },
];
