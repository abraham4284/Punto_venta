import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { toast, Toaster } from "react-hot-toast";
import { Meta } from "@/components/Meta";
import { ViewLoadingState } from "@/components/loading/ViewLoadingState";
import { ViewProcessingOverlay } from "@/components/loading/ViewProcessingOverlay";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCan } from "@/views/businesses-app/hooks/useCan";
import type { Customer } from "../../customers/types/customers.types";
import { useCustomers } from "../../customers/hooks/useCustomers";
import type { DepositResponse } from "../../deposits/types/deposits.types";
import { useDeposits } from "../../deposits/hooks/useDeposits";
import { usePaymentMethods } from "../../payment-methods/hooks/usePaymentMethods";
import { getDeliveryUsersForSaleRequest } from "../api/sales.api";
import {
  POSHotkeysLegend,
  ProductEntrySection,
  SaleCartSection,
  SaleCheckoutPanel,
  SaleContextSection,
  SaleDeliverySection,
  SalePaymentsSection,
  SearchProductModal,
  SaleSuccessModal,
} from "../components";
import { getFieldError, mapZodErrors } from "../helpers/createSale.helpers";
import { useSaleCashSession, useSales, useSalesHotkeys } from "../hooks";
import type { DeliveryUserOption } from "../types";
import { createSaleFormSchema } from "../validations/sales.validations";

export const CreateSalePage = () => {
  const navigate = useNavigate();
  const canViewCash = useCan("cash.view");
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [barcodeSearch, setBarcodeSearch] = useState("");
  const [deliveryUsers, setDeliveryUsers] = useState<DeliveryUserOption[]>([]);
  const [deliveryUsersLoading, setDeliveryUsersLoading] = useState(false);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [initialViewResolved, setInitialViewResolved] = useState(false);
  const defaultDepositWasSelected = useRef(false);
  const barcodeInputRef = useRef<HTMLInputElement | null>(null);

  const {
    customers,
    getCustomers,
    resetCustomers,
    loading: customersLoading,
  } = useCustomers();
  const {
    deposits,
    getDeposits,
    resetDeposits,
    loading: depositsLoading,
  } = useDeposits();
  const {
    activePaymentMethods,
    getPaymentMethods,
    loading: paymentMethodsLoading,
  } = usePaymentMethods();
  const {
    currentSession,
    loading: cashLoading,
    error: cashError,
    refreshCurrentSession,
  } = useSaleCashSession();
  const {
    header,
    delivery,
    payments,
    cart,
    products,
    totals,
    paymentTotals,
    priceType,
    isSaleCompleted,
    loadingProducts,
    saving,
    error,
    fieldErrors,
    isOpenSuccessModal,
    newSaleId,
    newSaleNumber,
    setPriceType,
    updateHeaderField,
    updateDeliveryField,
    toggleDelivery,
    updatePaymentField,
    addPaymentRow,
    removePaymentRow,
    changeDeposit,
    addToCart,
    removeFromCart,
    updateItemQuantity,
    updateItemDiscountPercent,
    setGlobalDiscountPercent,
    submitSale,
    setValidationErrors,
    resetSaleState,
  } = useSales();

  const activeDeposits = useMemo(() => {
    return deposits.filter((deposit) => deposit.isActive);
  }, [deposits]);

  const activeCustomers = useMemo(() => {
    return customers.filter((customer) => customer.isActive);
  }, [customers]);

  const selectedCustomer = useMemo(() => {
    if (!header.idCustomer) return null;

    return (
      customers.find((customer) => customer.idCustomer === header.idCustomer) ??
      null
    );
  }, [customers, header.idCustomer]);

  const hasSelectedPaymentMethod = useMemo(() => {
    return payments.some((payment) => Boolean(payment.idPaymentMethod));
  }, [payments]);

  const disabledReason = useMemo(() => {
    if (isSaleCompleted) return "La venta ya fue registrada.";
    if (!currentSession || currentSession.status !== "OPEN") {
      return "Debes abrir una caja antes de registrar una venta.";
    }
    if (!header.idDeposit) return "Selecciona un depósito.";
    if (cart.length === 0) return "Agrega al menos un producto.";
    if (!hasSelectedPaymentMethod) return "Selecciona un método de pago.";
    if (!paymentTotals.isBalanced) {
      return "La suma de pagos debe coincidir con el total.";
    }

    return null;
  }, [
    cart.length,
    currentSession,
    hasSelectedPaymentMethod,
    header.idDeposit,
    isSaleCompleted,
    paymentTotals.isBalanced,
  ]);

  const submitDisabled = saving || Boolean(disabledReason);
  const isPreparingSaleView =
    !initialViewResolved &&
    (!initialDataLoaded ||
      customersLoading ||
      depositsLoading ||
      paymentMethodsLoading ||
      deliveryUsersLoading ||
      cashLoading);

  useEffect(() => {
    let isMounted = true;

    const fetchDeliveryUsers = async () => {
      setDeliveryUsersLoading(true);

      try {
        const response = await getDeliveryUsersForSaleRequest();

        if (isMounted) {
          setDeliveryUsers(response.data.data ?? []);
        }
      } catch {
        if (isMounted) {
          setDeliveryUsers([]);
        }
      } finally {
        if (isMounted) {
          setDeliveryUsersLoading(false);
        }
      }
    };

    void Promise.allSettled([
      getCustomers(),
      getDeposits(),
      getPaymentMethods(true),
      fetchDeliveryUsers(),
    ]).finally(() => {
      if (isMounted) {
        setInitialDataLoaded(true);
      }
    });

    return () => {
      isMounted = false;
      resetCustomers();
      resetDeposits();
    };
  }, [
    getCustomers,
    getDeposits,
    getPaymentMethods,
    resetCustomers,
    resetDeposits,
  ]);

  useEffect(() => {
    if (isPreparingSaleView || initialViewResolved) return;

    const timeoutId = window.setTimeout(() => {
      setInitialViewResolved(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [initialViewResolved, isPreparingSaleView]);

  useEffect(() => {
    const nextCashSessionId = currentSession?.idCashSession ?? null;

    if (header.idCashSession !== nextCashSessionId) {
      updateHeaderField("idCashSession", nextCashSessionId);
    }
  }, [currentSession?.idCashSession, header.idCashSession, updateHeaderField]);

  useEffect(() => {
    if (payments[0]?.idPaymentMethod || activePaymentMethods.length === 0) {
      return;
    }

    const defaultPaymentMethod = activePaymentMethods.find((paymentMethod) => {
      return paymentMethod.isDefault;
    });
    const selectedPaymentMethod = defaultPaymentMethod ?? activePaymentMethods[0];

    updatePaymentField(
      payments[0].id,
      "idPaymentMethod",
      selectedPaymentMethod.idPaymentMethod,
    );
  }, [activePaymentMethods, payments, updatePaymentField]);

  useEffect(() => {
    if (!delivery.enabled || !selectedCustomer) return;

    if (!delivery.recipientName.trim()) {
      updateDeliveryField("recipientName", selectedCustomer.name);
    }

    if (!delivery.recipientPhone.trim() && selectedCustomer.phone) {
      updateDeliveryField("recipientPhone", selectedCustomer.phone);
    }

    if (!delivery.deliveryAddress.trim() && selectedCustomer.address) {
      updateDeliveryField("deliveryAddress", selectedCustomer.address);
    }
  }, [
    delivery.deliveryAddress,
    delivery.enabled,
    delivery.recipientName,
    delivery.recipientPhone,
    selectedCustomer,
    updateDeliveryField,
  ]);

  useEffect(() => {
    if (
      defaultDepositWasSelected.current ||
      header.idDeposit
    ) {
      return;
    }

    const defaultDeposit = deposits.find((deposit) => {
      return deposit.isActive && deposit.isDefault;
    });

    if (!defaultDeposit) return;

    const timeoutId = window.setTimeout(() => {
      defaultDepositWasSelected.current = true;
      void changeDeposit(defaultDeposit.idDeposit);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [changeDeposit, deposits, header.idDeposit]);

  useEffect(() => {
    if (!header.idDeposit || !currentSession) return;

    const timeoutId = window.setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [currentSession, header.idDeposit]);

  const handleCustomerSelect = (customer: Customer) => {
    updateHeaderField("idCustomer", customer.idCustomer);
  };

  const handleDepositSelect = useCallback(
    async (deposit: DepositResponse) => {
      const changed = await changeDeposit(deposit.idDeposit);

      if (!changed) return;
    },
    [changeDeposit],
  );

  const handleDeliveryToggle = useCallback(
    (enabled: boolean) => {
      if (!enabled && payments.some((payment) => payment.status === "PENDING")) {
        toast.error(
          "No podés quitar la entrega mientras existan pagos pendientes. Cambialos a Confirmado o mantené la entrega.",
          { id: "delivery-payment-status" },
        );
        return;
      }

      toggleDelivery(enabled);
    },
    [payments, toggleDelivery],
  );

  const resetSale = () => {
    setIsCustomerModalOpen(false);
    setBarcodeSearch("");
    defaultDepositWasSelected.current = false;
    resetSaleState();
  };

  const handleViewSaleDetails = (idSale: number) => {
    resetSale();
    navigate(`/admin/sales/${idSale}`);
  };

  const handleBarcodeSubmit = useCallback(() => {
    if (isSaleCompleted) {
      toast("La venta ya fue registrada. Inicia una nueva venta para continuar.", {
        id: "sale-completed-warning",
      });
      return;
    }

    const barcode = barcodeSearch.trim();

    if (!barcode) return;

    if (!header.idDeposit) {
      toast.error("Selecciona un depósito para escanear productos");
      return;
    }

    if (!currentSession) {
      toast.error("Debes abrir una caja antes de registrar una venta");
      return;
    }

    if (loadingProducts) {
      toast.error("Espera a que se carguen los productos del depósito");
      return;
    }

    const product = products.find((item) => {
      return item.isActive && item.barcode?.trim() === barcode;
    });

    if (!product || product.stockQuantity <= 0) {
      toast.error(
        "Este producto no existe o no está disponible en este depósito",
      );
      setBarcodeSearch("");
      return;
    }

    if (
      priceType === "WHOLESALE" &&
      (product.priceWholesale === null || product.priceWholesale <= 0)
    ) {
      toast.error("Este producto no tiene precio mayorista cargado");
      setBarcodeSearch("");
      return;
    }

    const existingItem = cart.find((item) => {
      return item.idProduct === product.idProduct;
    });
    const currentQuantity = existingItem?.quantity ?? 0;

    if (currentQuantity + 1 > product.stockQuantity) {
      toast.error("No hay stock suficiente para sumar otra unidad");
      setBarcodeSearch("");
      return;
    }

    addToCart([{ product, quantity: 1 }]);
    toast.success(`${product.name} agregado al carrito`);
    setBarcodeSearch("");
  }, [
    addToCart,
    barcodeSearch,
    cart,
    currentSession,
    header.idDeposit,
    isSaleCompleted,
    loadingProducts,
    priceType,
    products,
  ]);

  const handleOpenProductSearch = useCallback(() => {
    if (isSaleCompleted) {
      toast("La venta ya fue registrada. Inicia una nueva venta para continuar.", {
        id: "sale-completed-warning",
      });
      return;
    }

    if (!header.idDeposit) {
      toast.error("Selecciona un depósito para buscar productos");
      return;
    }

    if (!currentSession) {
      toast.error("Debes abrir una caja antes de registrar una venta");
      return;
    }

    setIsProductModalOpen(true);
  }, [currentSession, header.idDeposit, isSaleCompleted]);

  const handleSubmit = useCallback(async () => {
    if (isSaleCompleted) {
      toast("La venta ya fue registrada. Inicia una nueva venta para continuar.", {
        id: "sale-completed-warning",
      });
      return;
    }

    const latestSession = await refreshCurrentSession();

    if (!latestSession || latestSession.status !== "OPEN") {
      updateHeaderField("idCashSession", null);
      toast.error("Debes abrir una caja antes de registrar una venta.");
      return;
    }

    updateHeaderField("idCashSession", latestSession.idCashSession);

    try {
      createSaleFormSchema.parse({
        idCustomer: header.idCustomer ? header.idCustomer : null,
        idDeposit: header.idDeposit,
        idCashSession: latestSession.idCashSession,
        items: cart.map((item) => ({
          idProduct: item.idProduct,
          quantity: item.quantity,
          unitType: item.unitType,
          stockQuantity: item.stockQuantity,
          unitPrice: item.unitPrice,
          discount: item.discountAmount,
          total: item.total,
        })),
        payments: payments
          .filter((payment) => payment.idPaymentMethod)
          .map((payment) => ({
            idPaymentMethod: Number(payment.idPaymentMethod),
            amount:
              payments.length === 1 && !payment.amount.trim()
                ? totals.total
                : Number(payment.amount),
            status: payment.status,
          })),
        delivery: {
          enabled: delivery.enabled,
          recipientName: delivery.recipientName,
          deliveryAddress: delivery.deliveryAddress,
          deliveryReference: delivery.deliveryReference,
        },
      });

      if (!paymentTotals.isBalanced) {
        setValidationErrors({
          payments: "La suma de los pagos debe coincidir con el total de la venta",
        });
        return;
      }

      const { status, message } = await submitSale(latestSession.idCashSession);

      if (!status) {
        toast.error(message);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        setValidationErrors(mapZodErrors(error));
      }
    }
  }, [
    cart,
    delivery,
    header.idCustomer,
    header.idDeposit,
    isSaleCompleted,
    paymentTotals.isBalanced,
    payments,
    refreshCurrentSession,
    setValidationErrors,
    submitSale,
    totals.total,
    updateHeaderField,
  ]);

  useSalesHotkeys({
    onOpenSearch: handleOpenProductSearch,
    onFinalizeSale: () => {
      void handleSubmit();
    },
    isCartEmpty: cart.length === 0,
    isLoading: saving,
    isBlocked: isOpenSuccessModal || isSaleCompleted,
  });

  return (
    <>
      <Meta title="Nueva Venta" />
      <main className="relative min-h-full space-y-6 bg-background p-2 md:p-6">
        <section className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Nueva venta</h1>
            <p className="text-muted-foreground">
              Punto de venta rápido para escáner, carrito, pagos y entrega.
            </p>
          </div>
          <POSHotkeysLegend />
        </section>

        {isPreparingSaleView ? (
          <ViewLoadingState
            message="Preparando punto de venta..."
            description="Cargando caja, depósitos y configuración."
          />
        ) : (
          <>
            {saving && (
              <ViewProcessingOverlay
                message="Procesando venta..."
                description="Registrando la operación y actualizando el stock."
              />
            )}

            {!cashLoading && !currentSession && (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="flex flex-col justify-between gap-3 p-4 md:flex-row md:items-center">
                  <div>
                    <p className="font-semibold text-amber-950">
                      Debes abrir una caja antes de registrar una venta.
                    </p>
                    <p className="text-sm text-amber-900/80">
                      El sistema exige que toda venta pertenezca a una sesión
                      de caja abierta.
                    </p>
                    {cashError && (
                      <p className="mt-1 text-sm text-amber-900">
                        {cashError}
                      </p>
                    )}
                  </div>
                  {canViewCash && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/admin/cash")}
                    >
                      Ir a caja
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            <SaleContextSection
              cashSession={currentSession}
              selectedCustomer={selectedCustomer}
              selectedDepositId={header.idDeposit}
              isCustomerModalOpen={isCustomerModalOpen}
              customers={activeCustomers}
              deposits={activeDeposits}
              depositError={getFieldError(fieldErrors, "idDeposit")}
              onOpenCustomerModal={() => setIsCustomerModalOpen(true)}
              onCloseCustomerModal={() => setIsCustomerModalOpen(false)}
              onCustomerClear={() => {
                updateHeaderField("idCustomer", null);
              }}
              onCustomerSelect={handleCustomerSelect}
              onDepositSelect={(deposit) => {
                void handleDepositSelect(deposit);
              }}
            />

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <section className="space-y-5">
                <ProductEntrySection
                  barcode={barcodeSearch}
                  priceType={priceType}
                  disabled={
                    !header.idDeposit || !currentSession || isSaleCompleted
                  }
                  loadingProducts={loadingProducts}
                  inputRef={barcodeInputRef}
                  onBarcodeChange={setBarcodeSearch}
                  onBarcodeSubmit={handleBarcodeSubmit}
                  onOpenProductSearch={handleOpenProductSearch}
                  onPriceTypeChange={setPriceType}
                />

                <SaleCartSection
                  items={cart}
                  errors={fieldErrors}
                  subtotal={totals.subtotal}
                  discountPercent={header.discountPercent}
                  discountTotal={totals.discountTotal}
                  onQuantityChange={updateItemQuantity}
                  onDiscountPercentChange={updateItemDiscountPercent}
                  onRemove={removeFromCart}
                  onGlobalDiscountPercentChange={setGlobalDiscountPercent}
                />
              </section>

              <section className="space-y-4">
                <SaleCheckoutPanel
                  totals={totals}
                  paymentTotals={paymentTotals}
                  observation={header.observation}
                  error={error}
                  saving={saving}
                  disabled={submitDisabled}
                  disabledReason={disabledReason}
                  isSaleCompleted={isSaleCompleted}
                  onObservationChange={(value) =>
                    updateHeaderField("observation", value)
                  }
                  onSubmit={() => {
                    void handleSubmit();
                  }}
                  onReset={resetSale}
                />

                <SalePaymentsSection
                  payments={payments}
                  paymentMethods={activePaymentMethods}
                  paymentMethodsLoading={paymentMethodsLoading}
                  totals={paymentTotals}
                  hasDelivery={delivery.enabled}
                  disabled={isSaleCompleted || saving}
                  errors={fieldErrors}
                  onAddPayment={addPaymentRow}
                  onRemovePayment={removePaymentRow}
                  onPaymentChange={updatePaymentField}
                />

                <SaleDeliverySection
                  delivery={delivery}
                  deliveryUsers={deliveryUsers}
                  loadingUsers={deliveryUsersLoading}
                  disabled={isSaleCompleted || saving}
                  errors={fieldErrors}
                  onToggle={handleDeliveryToggle}
                  onDeliveryChange={updateDeliveryField}
                />
              </section>
            </div>

            <SearchProductModal
              isOpen={isProductModalOpen}
              products={products}
              priceType={priceType}
              loading={loadingProducts}
              onClose={() => setIsProductModalOpen(false)}
              onConfirm={(items) => {
                addToCart(items);
                if (items.length === 1) {
                  toast.success(`${items[0].product.name} agregado al carrito`);
                } else if (items.length > 1) {
                  toast.success(`${items.length} productos agregados al carrito`);
                }
                setIsProductModalOpen(false);
              }}
            />
            <SaleSuccessModal
              isOpen={isOpenSuccessModal}
              idSale={newSaleId}
              saleNumber={newSaleNumber}
              onResetForm={resetSale}
              onViewDetails={handleViewSaleDetails}
            />
          </>
        )}
        <Toaster position="top-right" reverseOrder={false} />
      </main>
    </>
  );
};
