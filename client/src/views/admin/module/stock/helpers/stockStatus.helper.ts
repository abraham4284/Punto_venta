import { Decimal } from "decimal.js";

export type StockStatusType = "OUT_OF_STOCK" | "LOW_STOCK" | "OK_STOCK";

export interface StockStatusResult {
  status: StockStatusType;
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
}

export const getStockStatus = (
  quantity: number,
  stockMin: number,
): StockStatusResult => {
  const currentQuantity = new Decimal(quantity || 0);
  const minimumStock = new Decimal(stockMin || 0);

  if (currentQuantity.lessThanOrEqualTo(0)) {
    return {
      status: "OUT_OF_STOCK",
      label: "Sin stock",
      variant: "destructive",
    };
  }

  if (currentQuantity.lessThanOrEqualTo(minimumStock)) {
    return {
      status: "LOW_STOCK",
      label: "Stock bajo",
      variant: "outline",
    };
  }

  return {
    status: "OK_STOCK",
    label: "Stock correcto",
    variant: "default",
  };
};

export const getStockDifference = (
  quantity: number,
  stockMin: number,
): string => {
  const currentQuantity = new Decimal(quantity || 0);
  const minimumStock = new Decimal(stockMin || 0);

  const difference = currentQuantity.minus(minimumStock);

  if (difference.isNegative()) {
    return `Faltan ${difference.abs().toFixed(2)}`;
  }

  if (difference.equals(0)) {
    return "En el mínimo";
  }

  return `Sobran ${difference.toFixed(2)}`;
};
