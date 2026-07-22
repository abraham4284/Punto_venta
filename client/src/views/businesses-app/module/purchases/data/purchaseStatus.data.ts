import type { PurchaseStatus } from "../types";

export const purchaseStatusOptions: {
  value: PurchaseStatus;
  label: string;
}[] = [
  { value: "COMPLETED", label: "Completada" },
  { value: "CANCELLED", label: "Anulada" },
];

export const getPurchaseStatusLabel = (status: PurchaseStatus): string => {
  return purchaseStatusOptions.find((option) => option.value === status)?.label ?? status;
};
