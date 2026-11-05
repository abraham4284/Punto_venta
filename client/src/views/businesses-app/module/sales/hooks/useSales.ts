import type { BusinessResponse } from "../../businesses/types";
import type { Customer } from "../../customers/types/customers.types";
import { getWholesalePricing, hasWholesalePrice, priceSaleCart, priceSaleItem, saleItemPayload, salePricingError } from "../helpers/wholesale-pricing.helpers";
import { emptyDeliveryProvider, deliveryProviderPayload } from "../../deliveries/helpers/delivery-provider.helpers";
import { useCallback, useMemo, useRef, useState } from "react";
import Decimal from "decimal.js";
import type { AxiosError } from "axios";
import { createIdempotencyKey } from "@/helpers/idempotency.helper";
import {
  createSaleRequest,
  getProductsByDepositRequest,
} from "../api/sales.api";
import type {
  ApiErrorResponse,
  CartItem,
  CreateSalePayload,
  FieldError,
  PriceType,
  SaleDeliveryInput,
  SalePaymentInput,
  ProductSelection,
  ProductWithStockResponse,
  ProductUnitType,
  SaleHeaderInput,
} from "../types";

type SaleLifecycle = "DRAFT" | "PROCESSING" | "COMPLETED";

const initialHeader: SaleHeaderInput = {
  idCustomer: null,
  idDeposit: null,
  idCashSession: null,
  discountPercent: 0,
  observation: "",
};

const initialDelivery: SaleDeliveryInput = {
  enabled: false,
  ...emptyDeliveryProvider,
  assignedToUserId: null,
  recipientName: "",
  recipientPhone: "",
  deliveryAddress: "",
  deliveryReference: "",
  scheduledAt: "",
  observation: "",
};

const createPaymentInput = (
  status: SalePaymentInput["status"] = "CONFIRMED",
): SalePaymentInput => {
  const id =
    globalThis.crypto?.randomUUID?.() ??
    `payment-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return {
    id,
    idPaymentMethod: null,
    amount: "",
    status,
    reference: "",
    observation: "",
  };
};

const toMoney = (value: Decimal.Value): number => {
  return Number(new Decimal(value).toDecimalPlaces(2).toString());
};

const normalizeSaleQuantity = (
  quantity: number,
  product: Pick<ProductWithStockResponse | CartItem, "stockQuantity" | "unitType">,
): number => {
  if (!Number.isFinite(quantity)) return product.unitType === "UNIT" ? 1 : 0.01;

  const minQuantity = product.unitType === "UNIT" ? 1 : 0.01;
  const boundedQuantity = Math.min(
    Math.max(quantity, minQuantity),
    product.stockQuantity,
  );

  if (product.unitType === "UNIT") {
    return Math.floor(boundedQuantity);
  }

  return Number(boundedQuantity.toFixed(2));
};

const normalizeProductUnitType = (
  unitType: ProductUnitType | undefined,
): ProductUnitType => {
  return unitType ?? "UNIT";
};

const calculateItem = (item: CartItem, quantity: number, discountPercent: number, priceType: PriceType): CartItem =>
  priceSaleItem(item, quantity, discountPercent, priceType === "WHOLESALE" ? "WHOLESALE" : "RETAIL");

const mapErrorsToRecord = (errors: FieldError[]): Record<string, string> => {
  return errors.reduce<Record<string, string>>((acc, error) => {
    acc[error.field] = error.message;
    return acc;
  }, {});
};

export const useSales = ({ business, customers }: { business: BusinessResponse | null; customers: Customer[] }) => {
  const [header, setHeader] = useState<SaleHeaderInput>(initialHeader);
  const [delivery, setDelivery] = useState<SaleDeliveryInput>(initialDelivery);
  const [payments, setPayments] = useState<SalePaymentInput[]>([
    createPaymentInput(),
  ]);
  const [cartDraft, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<ProductWithStockResponse[]>([]);
  const [pricingNeedsRefresh, setPricingNeedsRefresh] = useState(false);
  const productsRequestRef = useRef(0);
  const currentSaleFingerprintRef = useRef<string | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isOpenSuccessModal, setIsOpenSuccessModal] = useState(false);
  const [newSaleId, setNewSaleId] = useState<number | null>(null);
  const [newSaleNumber, setNewSaleNumber] = useState<string | null>(null);
  const [saleLifecycle, setSaleLifecycle] = useState<SaleLifecycle>("DRAFT");
  const submitLockRef = useRef(false);
  const currentSaleIdempotencyKeyRef = useRef<string | null>(null);

  const selectedCustomer = customers.find((customer) => customer.idCustomer === header.idCustomer) ?? null;
  const pricing = useMemo(() => getWholesalePricing(business, selectedCustomer, cartDraft, header.idCustomer != null), [business, selectedCustomer, cartDraft, header.idCustomer]);
  const priceType: PriceType = pricing.effectivePricingType === "WHOLESALE" ? "WHOLESALE" : "SALE";
  const cart = useMemo(() => priceSaleCart(cartDraft, pricing.effectivePricingType), [cartDraft, pricing.effectivePricingType]);
  const pricingBlockReason = pricingNeedsRefresh ? "Actualizá y revisá la política, el cliente y los productos antes de reintentar."
    : pricing.blockReason ?? (cart.some((item) => item.quantity > item.stockQuantity || item.stockQuantity <= 0) ? "Hay productos sin stock disponible. Revisá el carrito actualizado." : null);

  const totals = useMemo(() => {
    const subtotal = cart.reduce((acc, item) => {
      return acc.plus(item.subtotalBeforeDiscount);
    }, new Decimal(0));
    const itemDiscount = cart.reduce((acc, item) => {
      return acc.plus(item.discountAmount);
    }, new Decimal(0));
    const discountTotal = cart.reduce((sum, item) => sum.plus(saleItemPayload(item, header.discountPercent).discount), new Decimal(0));
    const globalDiscount = discountTotal.minus(itemDiscount);
    const total = Decimal.max(subtotal.minus(discountTotal), 0);

    return {
      subtotal: toMoney(subtotal),
      itemDiscount: toMoney(itemDiscount),
      globalDiscount: toMoney(globalDiscount),
      discountTotal: toMoney(discountTotal),
      total: toMoney(total),
    };
  }, [cart, header.discountPercent]);

  const paymentTotals = useMemo(() => {
    const usesImplicitSinglePayment =
      payments.length === 1 &&
      Boolean(payments[0]?.idPaymentMethod) &&
      payments[0]?.amount.trim() === "";
    const assigned = payments.reduce((acc, payment) => {
      const amount = Number(payment.amount);
      return Number.isFinite(amount) ? acc.plus(amount) : acc;
    }, new Decimal(0));
    const effectiveAssigned = usesImplicitSinglePayment ? new Decimal(totals.total) : assigned;
    const pending = Decimal.max(new Decimal(totals.total).minus(effectiveAssigned), 0);

    return {
      total: totals.total,
      assigned: toMoney(effectiveAssigned),
      pending: toMoney(pending),
      isBalanced: effectiveAssigned
        .toDecimalPlaces(2)
        .equals(new Decimal(totals.total).toDecimalPlaces(2)),
    };
  }, [payments, totals.total]);

  const clearErrors = useCallback(() => {
    setError(null);
    setFieldErrors({});
  }, []);

  const setValidationErrors = useCallback((errors: Record<string, string>) => {
    setFieldErrors(errors);
  }, []);

  const handleApiError = useCallback((error: unknown) => {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    const status = axiosError.response?.status;
    const pricingFailure = salePricingError(axiosError.response?.data?.code);
    const message = pricingFailure?.message ?? (!axiosError.response ? "No se pudo confirmar la venta. Reintentá con la misma clave."
      : status === 403 ? "No tenés permiso para realizar esta operación."
      : status === 400 ? "Revisá los datos de la venta y los errores indicados." : "No se pudo procesar la venta. Intentá nuevamente.");
    setError(message);
    if (pricingFailure?.refresh) setPricingNeedsRefresh(true);
    if (status === 400 && axiosError.response?.data?.errors?.length) {
      setFieldErrors(mapErrorsToRecord(axiosError.response.data.errors));
    }
    return { message, refreshPricing: pricingFailure?.refresh ?? false };
  }, []);

  const updateHeaderField = useCallback(
    <K extends keyof SaleHeaderInput>(field: K, value: SaleHeaderInput[K]) => {
      setHeader((current) => ({
        ...current,
        [field]: value,
      }));

    },
    [],
  );

  const updateDeliveryField = useCallback(
    <K extends keyof SaleDeliveryInput>(field: K, value: SaleDeliveryInput[K]) => {
      setDelivery((current) => ({
        ...current,
        [field]: value,
      }));
    },
    [],
  );

  const toggleDelivery = useCallback((enabled: boolean) => {
    setDelivery((current) => ({
      ...current,
      enabled,
    }));
  }, []);

  const updatePaymentField = useCallback(
    <K extends keyof SalePaymentInput>(
      id: string,
      field: K,
      value: SalePaymentInput[K],
    ) => {
      setPayments((currentPayments) =>
        currentPayments.map((payment) => {
          if (payment.id !== id) return payment;

          return {
            ...payment,
            [field]: value,
          };
        }),
      );
    },
    [],
  );

  const addPaymentRow = useCallback(() => {
    setPayments((currentPayments) => {
      const normalizedPayments = currentPayments.map((payment, index) => {
        if (index !== 0 || payment.amount.trim()) {
          return payment;
        }

        return {
          ...payment,
          amount: totals.total > 0 ? String(totals.total) : "",
        };
      });

      return [...normalizedPayments, createPaymentInput()];
    });
  }, [totals.total]);

  const removePaymentRow = useCallback((id: string) => {
    setPayments((currentPayments) => {
      if (currentPayments.length <= 1) return currentPayments;

      const nextPayments = currentPayments.filter((payment) => payment.id !== id);
      return nextPayments.length > 0 ? nextPayments : [createPaymentInput()];
    });
  }, []);

  const clearCart = useCallback(() => {
    productsRequestRef.current += 1;
    setCart([]);
    setProducts([]);
    setLoadingProducts(false);
    setHeader((current) => ({
      ...current,
      discountPercent: 0,
    }));
  }, []);

  const resetSaleState = () => {
    submitLockRef.current = false;
    currentSaleIdempotencyKeyRef.current = null;
    setSaleLifecycle("DRAFT");
    setHeader(initialHeader);
    setDelivery(initialDelivery);
    setPayments([createPaymentInput()]);
    productsRequestRef.current += 1;
    setCart([]);
    setProducts([]);
    setLoadingProducts(false);
    setPricingNeedsRefresh(false);
    currentSaleFingerprintRef.current = null;
    setError(null);
    setFieldErrors({});
    setNewSaleId(null);
    setNewSaleNumber(null);
    setIsOpenSuccessModal(false);
  };

  const closeSuccessModal = () => {
    setIsOpenSuccessModal(false);
  };

  const fetchProductsByDeposit = useCallback(
    async (idDeposit: number) => {
      const request = ++productsRequestRef.current;
      try {
        setLoadingProducts(true);
        const response = await getProductsByDepositRequest(idDeposit);
        if (request !== productsRequestRef.current) return;
        const nextProducts = response.data.data ?? [];
        setProducts(nextProducts);
        setCart((current) => current.map((item) => {
          const latest = nextProducts.find((product) => product.idProduct === item.idProduct);
          return latest ? { ...item, priceSale: latest.priceSale, priceWholesale: latest.priceWholesale, stockQuantity: latest.stockQuantity, unitType: latest.unitType }
            : { ...item, priceWholesale: null, stockQuantity: 0 };
        }));
        return nextProducts;
      } catch (error) {
        if (request === productsRequestRef.current) { handleApiError(error); setProducts([]); }
      } finally {
        if (request === productsRequestRef.current) setLoadingProducts(false);
      }
    },
    [handleApiError],
  );

  const changeDeposit = async (idDeposit: number): Promise<boolean> => {
    if (cart.length > 0 && idDeposit !== header.idDeposit) {
      const confirmed = window.confirm(
        "Cambiar el deposito vaciara el carrito actual. Deseas continuar?",
      );

      if (!confirmed) {
        return false;
      }

      clearCart();
    }

    setHeader((current) => ({
      ...current,
      idDeposit,
    }));

    clearErrors();
    await fetchProductsByDeposit(idDeposit);

    return true;
  };

  const addToCart = (items: ProductSelection[]) => {
    if (pricing.requiresWholesalePrice && items.some(({ product }) => !hasWholesalePrice(product))) {
      setError("Este cliente requiere productos con precio mayorista. No se agregó ningún producto de la selección.");
      return false;
    }
    setCart((current) => {
      const nextCart = [...current];

      items.forEach(({ product, quantity }) => {
        const existingIndex = nextCart.findIndex(
          (item) => item.idProduct === product.idProduct,
        );

        if (existingIndex >= 0) {
          const currentItem = nextCart[existingIndex];
          const nextQuantity = normalizeSaleQuantity(
            currentItem.quantity + quantity,
            currentItem,
          );

          nextCart[existingIndex] = calculateItem(
            currentItem,
            nextQuantity,
            currentItem.discountPercent,
            priceType,
          );
          return;
        }

        const unitType = normalizeProductUnitType(product.unitType);
        const safeQuantity = normalizeSaleQuantity(quantity, {
          stockQuantity: product.stockQuantity,
          unitType,
        });
        const newItem: CartItem = {
          idProduct: product.idProduct,
          name: product.name,
          barcode: product.barcode,
          imageUrl: product.imageUrl,
          stockQuantity: product.stockQuantity,
          priceSale: product.priceSale,
          priceWholesale: product.priceWholesale,
          unitType,
          quantity: safeQuantity,
          unitPrice: product.priceSale,
          discountPercent: 0,
          discountAmount: 0,
          subtotalBeforeDiscount: 0,
          total: 0,
        };

        nextCart.push(calculateItem(newItem, safeQuantity, 0, priceType));
      });

      return nextCart;
    });
    return true;
  };

  const removeFromCart = (idProduct: number) => {
    setCart((current) =>
      current.filter((item) => item.idProduct !== idProduct),
    );
  };

  const updateItemQuantity = (idProduct: number, quantity: number) => {
    setCart((current) =>
      current.map((item) => {
        if (item.idProduct !== idProduct) return item;

        const nextQuantity = normalizeSaleQuantity(quantity, item);

        return calculateItem(
          item,
          nextQuantity,
          item.discountPercent,
          priceType,
        );
      }),
    );
  };

  const updateItemDiscountPercent = (idProduct: number, value: number) => {
    setCart((current) =>
      current.map((item) => {
        if (item.idProduct !== idProduct) return item;

        return calculateItem(
          item,
          item.quantity,
          Math.min(Math.max(value, 0), 100),
          priceType,
        );
      }),
    );
  };

  const setGlobalDiscountPercent = (value: number) => {
    setHeader((current) => ({
      ...current,
      discountPercent: Math.min(Math.max(value, 0), 100),
    }));
  };

  const buildPayload = (cashSessionId?: number): CreateSalePayload => {
    const payloadItems = cart.map((item) => saleItemPayload(item, header.discountPercent));
    const subtotal = cart.reduce((acc, item) => {
      return acc.plus(item.subtotalBeforeDiscount);
    }, new Decimal(0));
    const discountTotal = payloadItems.reduce((acc, item) => {
      return acc.plus(item.discount);
    }, new Decimal(0));
    const total = Decimal.max(subtotal.minus(discountTotal), 0);

    const activePayments = payments
      .filter((payment) => payment.idPaymentMethod && Number(payment.amount) > 0)
      .map((payment) => ({
        idPaymentMethod: Number(payment.idPaymentMethod),
        amount: toMoney(Number(payment.amount)),
        status: delivery.enabled ? payment.status : "CONFIRMED" as const,
        reference: payment.reference.trim() || null,
        observation: payment.observation.trim() || null,
      }));
    const salePayments =
      activePayments.length > 0
        ? activePayments
        : [
            {
              idPaymentMethod: Number(payments[0]?.idPaymentMethod),
              amount: toMoney(total),
              status: delivery.enabled ? payments[0]?.status ?? "CONFIRMED" : "CONFIRMED",
              reference: null,
              observation: null,
            },
          ];

    return {
      pricingType: pricing.effectivePricingType,
      idCustomer: header.idCustomer,
      idDeposit: Number(header.idDeposit),
      idCashSession: Number(cashSessionId ?? header.idCashSession),
      subtotal: toMoney(subtotal),
      discountTotal: toMoney(discountTotal),
      total: toMoney(total),
      observation: header.observation.trim() || null,
      payments: salePayments,
      delivery: delivery.enabled
        ? {
            ...deliveryProviderPayload(delivery),
            recipientName: delivery.recipientName.trim(),
            recipientPhone: delivery.recipientPhone.trim() || null,
            deliveryAddress: delivery.deliveryAddress.trim(),
            deliveryReference: delivery.deliveryReference.trim() || null,
            scheduledAt: delivery.scheduledAt || null,
            observation: delivery.observation.trim() || null,
          }
        : null,
      items: payloadItems,
    };
  };

  const submitSale = async (cashSessionId?: number) => {
    if (saleLifecycle === "COMPLETED") {
      return {
        status: false,
        completed: true,
        message: "La venta ya fue registrada. Inicia una nueva venta para continuar.",
      };
    }

    if (submitLockRef.current) {
      return {
        status: false,
        processing: true,
        message: "La venta ya se esta procesando.",
      };
    }

    if (pricingBlockReason || !paymentTotals.isBalanced || cart.length === 0) {
      const message = pricingBlockReason ?? "Revisá el carrito y el balance de pagos antes de registrar la venta.";
      setError(message);
      return { status: false, message };
    }

    submitLockRef.current = true;

    try {
      setSaleLifecycle("PROCESSING");
      setSaving(true);
      clearErrors();

      const payload = buildPayload(cashSessionId);
      const fingerprint = JSON.stringify(payload);
      if (!currentSaleIdempotencyKeyRef.current || currentSaleFingerprintRef.current !== fingerprint) {
        currentSaleIdempotencyKeyRef.current = createIdempotencyKey();
        currentSaleFingerprintRef.current = fingerprint;
      }
      const response = await createSaleRequest(
        payload,
        currentSaleIdempotencyKeyRef.current,
      );
      const createdSaleId = response.data.data?.idSale ?? null;
      const createdSaleNumber = response.data.data?.saleNumber ?? null;

      currentSaleIdempotencyKeyRef.current = null;
      setNewSaleId(createdSaleId);
      setNewSaleNumber(createdSaleNumber);
      clearCart();
      setSaleLifecycle("COMPLETED");
      setIsOpenSuccessModal(true);

      return {
        status: true,
        message: response.data.message,
        data: response.data.data,
      };
    } catch (error) {
      const failure = handleApiError(error);
      const axiosError = error as AxiosError<ApiErrorResponse>;

      if (axiosError.response && axiosError.response.status < 500 && axiosError.response.data?.code !== "SALE_CONCURRENT_CHANGE") {
        currentSaleIdempotencyKeyRef.current = null;
      }

      setSaleLifecycle("DRAFT");

      return {
        status: false,
        ...failure,
      };
    } finally {
      submitLockRef.current = false;
      setSaving(false);
    }
  };

  const acknowledgePricingRefresh = useCallback(() => setPricingNeedsRefresh(false), []);

  return {
    header,
    delivery,
    payments,
    cart,
    products,
    totals,
    paymentTotals,
    priceType,
    pricing,
    pricingBlockReason,
    pricingNeedsRefresh,
    acknowledgePricingRefresh,
    saleLifecycle,
    loadingProducts,
    saving,
    error,
    fieldErrors,
    isOpenSuccessModal,
    newSaleId,
    newSaleNumber,
    isSaleCompleted: saleLifecycle === "COMPLETED",
    updateHeaderField,
    updateDeliveryField,
    toggleDelivery,
    updatePaymentField,
    addPaymentRow,
    removePaymentRow,
    changeDeposit,
    fetchProductsByDeposit,
    addToCart,
    removeFromCart,
    updateItemQuantity,
    updateItemDiscountPercent,
    setGlobalDiscountPercent,
    submitSale,
    clearErrors,
    setValidationErrors,
    clearCart,
    resetSaleState,
    closeSuccessModal,
  };
};
