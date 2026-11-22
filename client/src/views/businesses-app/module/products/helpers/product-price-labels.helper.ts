import { isAxiosError } from "axios";
import type { ProductPriceLabel } from "../types/products.types";

export type PriceLabelContent = {
  name: boolean;
  retail: boolean;
  wholesale: boolean;
  barcode: boolean;
  category: boolean;
};

export const defaultPriceLabelContent: PriceLabelContent = {
  name: true, retail: true, wholesale: true, barcode: false, category: false,
};

export type PriceLabelsSnapshot = {
  items: ProductPriceLabel[];
  businessName: string;
  content: PriceLabelContent;
};

const currency = new Intl.NumberFormat("es-AR", {
  style: "currency", currency: "ARS", minimumFractionDigits: 0, maximumFractionDigits: 2,
});
export const labelCurrency = (price: number) => currency.format(price);

export const priceLabelPages = (items: ProductPriceLabel[]) =>
  Array.from({ length: Math.ceil(items.length / 21) }, (_, page) => items.slice(page * 21, (page + 1) * 21));

export const togglePriceLabelPage = (selected: ReadonlySet<number>, ids: number[], checked: boolean) => {
  const next = new Set(selected);
  for (const id of ids) {
    if (checked) next.add(id);
    else next.delete(id);
  }
  return next;
};

export const priceLabelsError = (error: unknown) => {
  if (isAxiosError(error)) {
    if (error.response?.status === 422) return "Hay más de 2.000 productos. Aplicá filtros más específicos o reducí la selección.";
    if (error.response?.status === 400) return "Revisá los filtros o la selección de productos.";
    if (error.response?.status === 401) return "Tu sesión venció. Volvé a iniciar sesión.";
    if (error.response?.status === 403) return "No tenés permiso para consultar estos productos.";
  }
  return "No pudimos preparar las etiquetas. Volvé a intentar.";
};
