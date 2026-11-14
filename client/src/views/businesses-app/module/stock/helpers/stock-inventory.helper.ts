import { isAxiosError } from "axios";
import type { StockInventoryExport, StockInventoryFilters } from "../types/stock.types";

export const STOCK_CATEGORY_LIMIT = 30;
export const INVENTORY_EXPORT_LIMIT = 2000;

export const stockAlertLabels = { OK: "Stock óptimo", LOW: "Bajo stock", ZERO: "Sin stock" };

export type InventoryPrintReport = StockInventoryExport & {
  businessName: string;
  createdAt: Date;
  filters: StockInventoryFilters;
  categoryNames: string[];
  depositName: string;
  inactiveDepositIds: ReadonlySet<number>;
};

export const inventoryExportError = (error: unknown) => {
  if (isAxiosError<{ code?: string }>(error)) {
    const status = error.response?.status;
    if (status === 422 && error.response?.data?.code === "STOCK_EXPORT_LIMIT_EXCEEDED") {
      return "Hay más de 2.000 registros. Aplicá filtros más específicos para imprimir el inventario completo.";
    }
    if (status === 400) return "Revisá los filtros aplicados y volvé a intentar.";
    if (status === 401) return "Tu sesión venció. Volvé a iniciar sesión.";
    if (status === 403) return "No tenés permiso para imprimir el inventario.";
  }
  return "No pudimos preparar el inventario. Volvé a intentar.";
};

export const isCompleteInventoryExport = (data: StockInventoryExport | undefined) =>
  Boolean(data && Array.isArray(data.stock) && data.totalRecords === data.stock.length &&
    data.totalRecords <= INVENTORY_EXPORT_LIMIT);

export const prepareInventoryImages = (
  images: HTMLImageElement[],
  signal: AbortSignal,
  timeout = 6000,
): Promise<Set<number>> => new Promise((resolve) => {
  const loaded = new Set<number>();
  const pending = new Map<HTMLImageElement, () => void>();
  const finish = () => {
    clearTimeout(timer);
    signal.removeEventListener("abort", finish);
    pending.forEach((unsubscribe) => unsubscribe());
    pending.clear();
    resolve(loaded);
  };
  const timer = setTimeout(finish, timeout);
  if (signal.aborted) {
    finish();
    return;
  }
  signal.addEventListener("abort", finish, { once: true });
  const recordLoaded = (image: HTMLImageElement) => {
    if (image.naturalWidth > 0) loaded.add(Number(image.dataset.stockImage));
  };
  for (const image of images) {
    if (image.complete) {
      recordLoaded(image);
      continue;
    }
    const settled = () => {
      recordLoaded(image);
      pending.get(image)?.();
      pending.delete(image);
      if (!pending.size) finish();
    };
    pending.set(image, () => {
      image.removeEventListener("load", settled);
      image.removeEventListener("error", settled);
    });
    image.addEventListener("load", settled);
    image.addEventListener("error", settled);
  }
  if (!pending.size) finish();
});
