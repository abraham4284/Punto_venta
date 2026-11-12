import type {
  AdvancedStockInventoryItem,
  ApiErrorResponse,
  FieldError,
  ProcessStockTransfersPayload,
} from "../types/stock.types";

export const MAX_TRANSFER_ITEMS = 100;

export interface StockTransferLine {
  product: AdvancedStockInventoryItem;
  quantity: string;
}

export const canAddTransferProduct = (product: AdvancedStockInventoryItem, origin: number) =>
  product.idDeposit === origin && product.isActive && Number.isFinite(product.quantity) && product.quantity > 0;

export const addTransferLine = (
  items: StockTransferLine[],
  product: AdvancedStockInventoryItem,
  origin: number,
): StockTransferLine[] => {
  if (!canAddTransferProduct(product, origin) || items.length >= MAX_TRANSFER_ITEMS ||
      items.some((item) => item.product.idProduct === product.idProduct)) return items;
  const quantity = product.unitType === "UNIT" || product.quantity >= 1 ? "1" : "0.01";
  return [...items, { product, quantity }];
};

export const getTransferQuantityError = ({ product, quantity }: StockTransferLine): string | undefined => {
  if (!product.isActive) return "El producto ya no está disponible en el origen.";
  const value = Number(quantity);
  if (!Number.isFinite(value) || value <= 0 || value >= 1e16) return "Ingresá una cantidad positiva válida.";
  if (product.unitType === "UNIT" && !Number.isInteger(value)) return "Ingresá una cantidad entera.";
  if (!/^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/.test(quantity)) return "Ingresá hasta dos decimales.";
  if (value > product.quantity) return "La cantidad supera el stock disponible.";
};

export const buildStockTransferPayload = (
  idDepositFrom: number,
  idDepositTo: number,
  observation: string,
  lines: StockTransferLine[],
): ProcessStockTransfersPayload | null => {
  if (!Number.isInteger(idDepositFrom) || idDepositFrom <= 0 ||
      !Number.isInteger(idDepositTo) || idDepositTo <= 0 ||
      idDepositFrom === idDepositTo || observation.trim().length > 255 ||
      lines.length === 0 || lines.length > MAX_TRANSFER_ITEMS ||
      new Set(lines.map(({ product }) => product.idProduct)).size !== lines.length ||
      lines.some((line) => !canAddTransferProduct(line.product, idDepositFrom) || getTransferQuantityError(line))) {
    return null;
  }
  return {
    idDepositFrom,
    idDepositTo,
    observation: observation.trim() || null,
    items: lines.map(({ product, quantity }) => ({ idProduct: product.idProduct, quantity: Number(quantity) })),
  };
};

export const refreshTransferLines = (
  lines: StockTransferLine[],
  current: ReadonlyMap<number, AdvancedStockInventoryItem>,
): StockTransferLine[] =>
  lines.map(({ product, quantity }) => ({
    product: current.get(product.idProduct) ?? { ...product, isActive: false, quantity: 0 },
    quantity,
  }));

export const getStockTransferFailure = (
  status?: number,
  body?: ApiErrorResponse & { code?: string },
): { message: string; errors: FieldError[]; requiresRefresh: boolean; requiresReview: boolean } => {
  if (status === 409 && body?.code === "STOCK_TRANSFER_CONCURRENT_CHANGE") {
    return {
      message: "El stock cambió mientras se procesaba la transferencia. Actualizá los saldos antes de confirmar.",
      errors: [],
      requiresRefresh: true,
      requiresReview: false,
    };
  }
  if (status === 400) {
    return {
      message: body?.message || "Revisá los datos de la transferencia.",
      errors: Array.isArray(body?.errors) ? body.errors : [],
      requiresRefresh: false,
      requiresReview: false,
    };
  }
  if (status === 401 || status === 402 || status === 403) {
    return {
      message: "No se pudo autorizar la transferencia.",
      errors: [],
      requiresRefresh: false,
      requiresReview: false,
    };
  }
  return {
    message: "No se pudo confirmar el resultado. Revisá los movimientos antes de volver a enviar.",
    errors: [],
    requiresRefresh: false,
    requiresReview: true,
  };
};
