import { useCallback, useMemo, useRef, useState } from "react";
import Decimal from "decimal.js";
import type { AxiosError } from "axios";
import { createIdempotencyKey } from "@/helpers/idempotency.helper";
import {
  cancelSale,
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
  idPaymentMethod: null,
  saleDate: new Date(),
  subtotal: 0,
  discountPercent: 0,
  discountTotal: 0,
  total: 0,
  observation: "",
  status: "COMPLETED",
};

const initialDelivery: SaleDeliveryInput = {
  enabled: false,
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

const hasWholesalePrice = (
  product: ProductWithStockResponse | CartItem,
): boolean => {
  return product.priceWholesale !== null && product.priceWholesale > 0;
};

const getPriceByType = (
  product: ProductWithStockResponse | CartItem,
  priceType: PriceType,
): number => {
  if (priceType === "WHOLESALE" && product.priceWholesale !== null) {
    return product.priceWholesale;
  }

  return product.priceSale;
};

const calculateItem = (
  item: CartItem,
  quantity: number,
  discountPercent: number,
  priceType: PriceType,
): CartItem => {
  const unitPrice = getPriceByType(item, priceType);
  const subtotalBeforeDiscount = new Decimal(unitPrice).mul(quantity);
  const discountAmount = subtotalBeforeDiscount.mul(discountPercent).div(100);
  const total = Decimal.max(subtotalBeforeDiscount.minus(discountAmount), 0);

  return {
    ...item,
    quantity,
    unitPrice: toMoney(unitPrice),
    discountPercent,
    discountAmount: toMoney(discountAmount),
    subtotalBeforeDiscount: toMoney(subtotalBeforeDiscount),
    total: toMoney(total),
  };
};

const mapErrorsToRecord = (errors: FieldError[]): Record<string, string> => {
  return errors.reduce<Record<string, string>>((acc, error) => {
    acc[error.field] = error.message;
    return acc;
  }, {});
};

export const useSales = () => {
  const [header, setHeader] = useState<SaleHeaderInput>(initialHeader);
  const [delivery, setDelivery] = useState<SaleDeliveryInput>(initialDelivery);
  const [payments, setPayments] = useState<SalePaymentInput[]>([
    createPaymentInput(),
  ]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<ProductWithStockResponse[]>([]);
  const [priceType, setPriceTypeState] = useState<PriceType>("SALE");
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isOpenSuccessModal, setIsOpenSuccessModal] = useState(false);
  const [newSaleId, setNewSaleId] = useState<number | null>(null);
  const [newSaleNumber, setNewSaleNumber] = useState<string | null>(null);
  const [saleLifecycle, setSaleLifecycle] = useState<SaleLifecycle>("DRAFT");
  const [cancelingId, setCancelingId] = useState<number | null>(null);
  const submitLockRef = useRef(false);
  const currentSaleIdempotencyKeyRef = useRef<string | null>(null);

  const totals = useMemo(() => {
    const subtotal = cart.reduce((acc, item) => {
      return acc.plus(item.subtotalBeforeDiscount);
    }, new Decimal(0));
    const itemDiscount = cart.reduce((acc, item) => {
      return acc.plus(item.discountAmount);
    }, new Decimal(0));
    const globalDiscount = subtotal.mul(header.discountPercent).div(100);
    const discountTotal = itemDiscount.plus(globalDiscount);
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
    const backendErrors = axiosError.response?.data?.errors ?? [];

    setError(
      axiosError.response?.data?.message || "No se pudo procesar la venta",
    );

    if (backendErrors.length > 0) {
      setFieldErrors(mapErrorsToRecord(backendErrors));
    }
  }, []);

  const updateHeaderField = useCallback(
    <K extends keyof SaleHeaderInput>(field: K, value: SaleHeaderInput[K]) => {
      setHeader((current) => ({
        ...current,
        [field]: value,
      }));

      if (field === "idPaymentMethod") {
        setPayments((currentPayments) => {
          const firstPayment = currentPayments[0] ?? createPaymentInput();

          return [
            {
              ...firstPayment,
              idPaymentMethod: value as number | null,
            },
            ...currentPayments.slice(1),
          ];
        });
      }
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

    if (!enabled) {
      setPayments((currentPayments) =>
        currentPayments.map((payment) => ({
          ...payment,
          status: "CONFIRMED",
        })),
      );
    }
  }, []);

  const updatePaymentField = useCallback(
    <K extends keyof SalePaymentInput>(
      id: string,
      field: K,
      value: SalePaymentInput[K],
    ) => {
      const isFirstPayment = payments[0]?.id === id;

      setPayments((currentPayments) =>
        currentPayments.map((payment) => {
          if (payment.id !== id) return payment;

          return {
            ...payment,
            [field]: value,
          };
        }),
      );

      if (isFirstPayment && field === "idPaymentMethod") {
        setHeader((current) => ({
          ...current,
          idPaymentMethod: value as number | null,
        }));
      }
    },
    [payments],
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
      const firstPayment = nextPayments[0] ?? createPaymentInput();

      setHeader((current) => ({
        ...current,
        idPaymentMethod: firstPayment.idPaymentMethod,
      }));

      return nextPayments.length > 0 ? nextPayments : [createPaymentInput()];
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setProducts([]);
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
    setCart([]);
    setProducts([]);
    setPriceTypeState("SALE");
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
      try {
        setLoadingProducts(true);
        clearErrors();

        const response = await getProductsByDepositRequest(idDeposit);

        setProducts(response.data.data ?? []);
      } catch (error) {
        handleApiError(error);
        setProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    },
    [clearErrors, handleApiError],
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

    await fetchProductsByDeposit(idDeposit);

    return true;
  };

  const setPriceType = (nextPriceType: PriceType) => {
    setPriceTypeState(nextPriceType);
    setCart((current) =>
      current
        .filter((item) => {
          return nextPriceType === "SALE" || hasWholesalePrice(item);
        })
        .map((item) => {
          return calculateItem(
            item,
            item.quantity,
            item.discountPercent,
            nextPriceType,
          );
        }),
    );
  };

  const addToCart = (items: ProductSelection[]) => {
    setCart((current) => {
      const nextCart = [...current];

      items.forEach(({ product, quantity }) => {
        if (priceType === "WHOLESALE" && !hasWholesalePrice(product)) {
          return;
        }

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
          unitPrice: getPriceByType(product, priceType),
          discountPercent: 0,
          discountAmount: 0,
          subtotalBeforeDiscount: 0,
          total: 0,
        };

        nextCart.push(calculateItem(newItem, safeQuantity, 0, priceType));
      });

      return nextCart;
    });
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

  const buildPayload = (): CreateSalePayload => {
    const payloadItems = cart.map((item) => {
      const globalDiscountAmount = new Decimal(item.subtotalBeforeDiscount)
        .mul(header.discountPercent)
        .div(100);
      const totalDiscount = new Decimal(item.discountAmount).plus(
        globalDiscountAmount,
      );
      const total = Decimal.max(
        new Decimal(item.subtotalBeforeDiscount).minus(totalDiscount),
        0,
      );

      return {
        idProduct: item.idProduct,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: toMoney(totalDiscount),
        total: toMoney(total),
      };
    });
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
              idPaymentMethod: Number(header.idPaymentMethod),
              amount: toMoney(total),
              status: delivery.enabled ? payments[0]?.status ?? "CONFIRMED" : "CONFIRMED",
              reference: null,
              observation: null,
            },
          ];

    return {
      idCustomer: header.idCustomer,
      idDeposit: Number(header.idDeposit),
      idCashSession: Number(header.idCashSession),
      subtotal: toMoney(subtotal),
      discountTotal: toMoney(discountTotal),
      total: toMoney(total),
      observation: header.observation.trim() || null,
      payments: salePayments,
      delivery: delivery.enabled
        ? {
            assignedToUserId: delivery.assignedToUserId,
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

  const submitSale = async () => {
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

    submitLockRef.current = true;
    currentSaleIdempotencyKeyRef.current =
      currentSaleIdempotencyKeyRef.current ?? createIdempotencyKey();

    try {
      setSaleLifecycle("PROCESSING");
      setSaving(true);
      clearErrors();

      const payload = buildPayload();
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
      handleApiError(error);
      const axiosError = error as AxiosError<ApiErrorResponse>;

      if (axiosError.response) {
        currentSaleIdempotencyKeyRef.current = null;
      }

      setSaleLifecycle("DRAFT");

      return {
        status: false,
        message: "No se pudo crear la venta",
      };
    } finally {
      submitLockRef.current = false;
      setSaving(false);
    }
  };

  const cancelSaleAction = async (idSale: number) => {
    try {
      setCancelingId(idSale);
      clearErrors();

      const response = await cancelSale(idSale);

      return {
        status: true,
        message: response.data.message,
        data: response.data.data,
      };
    } catch (error) {
      handleApiError(error);

      return {
        status: false,
        message: "No se pudo anular la venta",
      };
    } finally {
      setCancelingId(null);
    }
  };

  return {
    header,
    delivery,
    payments,
    cart,
    products,
    totals,
    paymentTotals,
    priceType,
    saleLifecycle,
    loadingProducts,
    saving,
    error,
    fieldErrors,
    isOpenSuccessModal,
    newSaleId,
    newSaleNumber,
    cancelingId,
    isSaleCompleted: saleLifecycle === "COMPLETED",
    setPriceType,
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
    cancelSaleAction,
    clearErrors,
    setValidationErrors,
    clearCart,
    resetSaleState,
    closeSuccessModal,
  };
};
