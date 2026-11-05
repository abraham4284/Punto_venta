import Decimal from "decimal.js";
import type { BusinessResponse } from "../../businesses/types";
import type { Customer } from "../../customers/types/customers.types";
import type { CartItem, SaleDetailInput, SalePricingType } from "../types";

type PricingItem = Pick<CartItem, "priceWholesale" | "quantity" | "unitType">;
export type WholesalePolicy = Pick<BusinessResponse, "wholesaleEnabled" | "wholesaleMinimumAmount">;
export const hasWholesalePrice = (item: Pick<CartItem, "priceWholesale">): boolean =>
  item.priceWholesale != null && Number.isFinite(item.priceWholesale) && item.priceWholesale > 0;

export const getWholesalePricing = (
  business: WholesalePolicy | null, customer: Customer | null, items: PricingItem[], customerSelected = Boolean(customer),
) => {
  const allItemsHaveWholesalePrice = items.every(hasWholesalePrice);
  const quantitiesValid = items.every((item) => Number.isFinite(item.quantity) && item.quantity > 0
    && new Decimal(item.quantity).decimalPlaces() <= 2
    && (item.unitType !== "UNIT" || Number.isInteger(item.quantity)));
  const wholesaleCandidate = items.reduce((sum, item) => hasWholesalePrice(item) && Number.isFinite(item.quantity)
    ? sum.plus(new Decimal(item.quantity).mul(item.priceWholesale!).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)) : sum, new Decimal(0));
  const validMinimum = business?.wholesaleMinimumAmount != null && Number.isFinite(business.wholesaleMinimumAmount)
    && business.wholesaleMinimumAmount > 0;
  const enabled = business?.wholesaleEnabled === true && validMinimum;
  const requiresWholesalePrice = Boolean(enabled && customer?.pricingTier === "WHOLESALE");
  const qualifies = Boolean(enabled && customer?.isActive && items.length > 0 && allItemsHaveWholesalePrice
    && quantitiesValid && wholesaleCandidate.gte(business!.wholesaleMinimumAmount!));
  const effectivePricingType: SalePricingType = requiresWholesalePrice || qualifies ? "WHOLESALE" : "RETAIL";
  const amountRemaining = validMinimum ? Decimal.max(new Decimal(business!.wholesaleMinimumAmount!).minus(wholesaleCandidate), 0).toNumber() : null;
  const blockReason = !business ? "No se pudo cargar la política de precios del negocio. Reintentá la carga."
    : business.wholesaleEnabled && !validMinimum ? "La configuración mayorista no tiene un mínimo válido. Revisá Mi Empresa."
    : customerSelected && !customer ? "No se pudo validar el cliente seleccionado. Actualizá los datos o elegí otro cliente."
    : customer && !customer.isActive ? "El cliente seleccionado está inactivo. Elegí otro cliente."
    : requiresWholesalePrice && !allItemsHaveWholesalePrice ? "El cliente es mayorista y hay productos sin precio mayorista. Retiralos del carrito o cambiá el cliente."
    : !quantitiesValid ? "Revisá las cantidades: Unidad admite enteros y las demás unidades hasta dos decimales." : null;
  return { effectivePricingType, wholesaleCandidate: wholesaleCandidate.toNumber(), allItemsHaveWholesalePrice,
    amountRemaining, requiresWholesalePrice, qualifiesForPromotion: qualifies && customer?.pricingTier === "RETAIL", blockReason };
};

export const priceSaleItem = (item: CartItem, quantity: number, discountPercent: number, pricingType: SalePricingType): CartItem => {
  // Invalid wholesale rows remain visible and block submission; never use a retail fallback.
  const unitPrice = pricingType === "WHOLESALE" ? (hasWholesalePrice(item) ? item.priceWholesale! : 0) : item.priceSale;
  const gross = new Decimal(unitPrice).mul(quantity).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const discount = gross.mul(discountPercent).div(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  return { ...item, quantity, unitPrice, discountPercent, subtotalBeforeDiscount: gross.toNumber(),
    discountAmount: discount.toNumber(), total: Decimal.max(gross.minus(discount), 0).toNumber() };
};

export const priceSaleCart = (items: CartItem[], pricingType: SalePricingType): CartItem[] =>
  items.map((item) => priceSaleItem(item, item.quantity, item.discountPercent, pricingType));

export const saleItemPayload = (item: CartItem, globalDiscountPercent: number): SaleDetailInput => {
  const gross = new Decimal(item.subtotalBeforeDiscount);
  const global = gross.mul(globalDiscountPercent).div(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const discount = global.plus(item.discountAmount);
  return { idProduct: item.idProduct, quantity: item.quantity, unitPrice: item.unitPrice,
    discount: discount.toNumber(), total: Decimal.max(gross.minus(discount), 0).toNumber() };
};

export const salePricingLabel = (type: SalePricingType | null): string =>
  type === "RETAIL" ? "Minorista" : type === "WHOLESALE" ? "Mayorista" : "No registrado";

const pricingMessages: Record<string, string> = {
  WHOLESALE_DISABLED: "El negocio deshabilitó los precios mayoristas. Actualizá la política antes de reintentar.",
  WHOLESALE_CUSTOMER_REQUIRED: "Seleccioná un cliente para registrar una venta mayorista.",
  WHOLESALE_CUSTOMER_INVALID: "El cliente no está habilitado para esta venta. Actualizá o cambiá el cliente.",
  WHOLESALE_CUSTOMER_NOT_FOUND: "El cliente seleccionado ya no está disponible.",
  WHOLESALE_CUSTOMER_INACTIVE: "El cliente seleccionado está inactivo.",
  WHOLESALE_MINIMUM_NOT_REACHED: "La compra ya no alcanza el mínimo mayorista vigente. Revisá el carrito actualizado.",
  WHOLESALE_PRICE_MISSING: "Hay un producto sin precio mayorista disponible. Revisá los productos actualizados.",
  WHOLESALE_PRICE_MISMATCH: "Cambió un precio mayorista. Revisá los precios actualizados antes de confirmar.",
  WHOLESALE_INVALID_QUANTITY: "Revisá las cantidades según la unidad y precisión del producto.",
  SALE_CONCURRENT_CHANGE: "Otra operación modificó los datos. Reintentá la venta con la misma clave.",
};
export const salePricingError = (code?: string): { message: string; refresh: boolean } | null => code && pricingMessages[code]
  ? { message: pricingMessages[code], refresh: code !== "SALE_CONCURRENT_CHANGE" } : null;
