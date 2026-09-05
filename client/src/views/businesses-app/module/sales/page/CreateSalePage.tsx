import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, ScanLine, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Meta } from "@/components/Meta";
import { ViewLoadingState } from "@/components/loading/ViewLoadingState";
import { ViewProcessingOverlay } from "@/components/loading/ViewProcessingOverlay";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast, Toaster } from "react-hot-toast";
import type { Customer } from "../../customers/types/customers.types";
import { useCustomers } from "../../customers/hooks/useCustomers";
import type { DepositResponse } from "../../deposits/types/deposits.types";
import { useDeposits } from "../../deposits/hooks/useDeposits";
import { useCash } from "../../cash/hooks/useCash";
import { usePaymentMethods } from "../../payment-methods/hooks/usePaymentMethods";
import { paymentMethodTypeLabels } from "../../payment-methods/helpers/payment-method.helpers";
import { getDeliveryUsersForSaleRequest } from "../api/sales.api";
import {
  CartTable,
  POSHotkeysLegend,
  SearchProductModal,
  SaleSuccessModal,
  SearchBox,
} from "../components";
import { useSalesHotkeys } from "../hooks/useSalesHotkeys";
import { useSales } from "../hooks/useSales";
import type { DeliveryUserOption } from "../types";
import { createSaleFormSchema } from "../validations/sales.validations";

const today = new Date().toISOString().slice(0, 10);

const formatMoney = (value: number): string => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(value);
};

const mapZodErrors = (error: z.ZodError): Record<string, string> => {
  return error.issues.reduce<Record<string, string>>((acc, issue) => {
    acc[issue.path.join(".")] = issue.message;
    return acc;
  }, {});
};

const getFieldError = (
  errors: Record<string, string>,
  field: string,
): string | undefined => {
  return errors[field];
};

export const CreateSalePage = () => {
  const navigate = useNavigate();
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [depositSearch, setDepositSearch] = useState("");
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
    refreshDashboard: refreshCashDashboard,
  } = useCash();
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

  const filteredCustomers = useMemo(() => {
    const value = customerSearch.trim().toLowerCase();
    const activeCustomers = customers.filter((customer) => customer.isActive);

    if (!value) return activeCustomers.slice(0, 8);

    return activeCustomers
      .filter((customer) => customer.name.toLowerCase().includes(value))
      .slice(0, 8);
  }, [customerSearch, customers]);

  const filteredDeposits = useMemo(() => {
    const value = depositSearch.trim().toLowerCase();
    const activeDeposits = deposits.filter((deposit) => deposit.isActive);

    if (!value) return activeDeposits.slice(0, 8);

    return activeDeposits
      .filter((deposit) => deposit.name.toLowerCase().includes(value))
      .slice(0, 8);
  }, [depositSearch, deposits]);

  const selectedCustomer = useMemo(() => {
    if (!header.idCustomer) return null;

    return customers.find((customer) => customer.idCustomer === header.idCustomer) ?? null;
  }, [customers, header.idCustomer]);

  const getPaymentMethodLabel = useCallback(
    (idPaymentMethod: number | null) => {
      const selectedPaymentMethod = activePaymentMethods.find((paymentMethod) => {
        return paymentMethod.idPaymentMethod === idPaymentMethod;
      });

      if (!selectedPaymentMethod) return "";

      return `${selectedPaymentMethod.name} · ${paymentMethodTypeLabels[selectedPaymentMethod.code]}`;
    },
    [activePaymentMethods],
  );

  const getPaymentMethodById = useCallback(
    (idPaymentMethod: number | null) => {
      return activePaymentMethods.find((paymentMethod) => {
        return paymentMethod.idPaymentMethod === idPaymentMethod;
      }) ?? null;
    },
    [activePaymentMethods],
  );

  const getPaymentStatusLabel = useCallback(
    (status: "PENDING" | "CONFIRMED") => {
      return status === "CONFIRMED" ? "Pagado ahora" : "Cobra cadete al entregar";
    },
    [],
  );

  const getDeliveryUserLabel = useCallback(
    (idUser: number | null) => {
      const selectedUser = deliveryUsers.find((user) => user.idUser === idUser);

      if (!selectedUser) return "";

      return `${selectedUser.name} (${selectedUser.username})`;
    },
    [deliveryUsers],
  );

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
    if (header.idPaymentMethod) return;

    const defaultPaymentMethod = activePaymentMethods.find((paymentMethod) => {
      return paymentMethod.isDefault;
    });
    const firstActivePaymentMethod = activePaymentMethods[0];
    const selectedPaymentMethod = defaultPaymentMethod ?? firstActivePaymentMethod;

    if (selectedPaymentMethod) {
      updateHeaderField(
        "idPaymentMethod",
        selectedPaymentMethod.idPaymentMethod,
      );
    }
  }, [activePaymentMethods, header.idPaymentMethod, updateHeaderField]);

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

  const handleCustomerSelect = (customer: Customer) => {
    updateHeaderField("idCustomer", customer.idCustomer);
    setCustomerSearch(customer.name);
  };

  const handleDepositSelect = useCallback(
    async (deposit: DepositResponse) => {
      const changed = await changeDeposit(deposit.idDeposit);

      if (changed) {
        setDepositSearch(deposit.name);
      }
    },
    [changeDeposit],
  );

  useEffect(() => {
    if (
      defaultDepositWasSelected.current ||
      header.idDeposit ||
      depositSearch
    ) {
      return;
    }

    const defaultDeposit = deposits.find((deposit) => {
      return deposit.isActive && deposit.isDefault;
    });

    if (!defaultDeposit) return;

    const timeoutId = window.setTimeout(() => {
      defaultDepositWasSelected.current = true;
      setDepositSearch(defaultDeposit.name);
      void changeDeposit(defaultDeposit.idDeposit);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [changeDeposit, deposits, header.idDeposit, depositSearch]);

  useEffect(() => {
    if (!header.idDeposit) return;

    const timeoutId = window.setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [header.idDeposit]);

  const resetSale = () => {
    setCustomerSearch("");
    setDepositSearch("");
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
      toast.error("Selecciona un deposito para escanear productos");
      return;
    }

    if (!header.idCashSession) {
      toast.error("Debes abrir una caja antes de registrar una venta");
      return;
    }

    if (loadingProducts) {
      toast.error("Espera a que se carguen los productos del deposito");
      return;
    }

    const product = products.find((item) => {
      return item.isActive && item.barcode?.trim() === barcode;
    });

    if (!product || product.stockQuantity <= 0) {
      toast.error(
        "Este producto no existe o no esta disponible en este deposito",
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

    const existingItem = cart.find(
      (item) => item.idProduct === product.idProduct,
    );
    const currentQuantity = existingItem?.quantity ?? 0;

    if (currentQuantity + 1 > product.stockQuantity) {
      toast.error("No hay stock suficiente para sumar otra unidad");
      setBarcodeSearch("");
      return;
    }

    addToCart([{ product, quantity: 1 }]);
    toast.success(`${product.name} agregado al carrito`);
    setBarcodeSearch("");
  }, [addToCart, barcodeSearch, cart, header.idCashSession, header.idDeposit, isSaleCompleted, loadingProducts, priceType, products]);

  const handleSubmit = useCallback(async () => {
    if (isSaleCompleted) {
      toast("La venta ya fue registrada. Inicia una nueva venta para continuar.", {
        id: "sale-completed-warning",
      });
      return;
    }

    try {
      createSaleFormSchema.parse({
        idCustomer: header.idCustomer ? header.idCustomer : null,
        idDeposit: header.idDeposit,
        idCashSession: header.idCashSession,
        idPaymentMethod: header.idPaymentMethod,
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
            amount: payment.amount.trim() ? Number(payment.amount) : totals.total,
            status: delivery.enabled ? payment.status : "CONFIRMED",
          })),
        delivery: {
          enabled: delivery.enabled,
          assignedToUserId: delivery.assignedToUserId,
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

      const { status, message } = await submitSale();
      if (!status) {
        toast.error(message);
      } else {
        await refreshCashDashboard();
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        setValidationErrors(mapZodErrors(error));
      }
    }
  }, [
    cart,
    header.idCustomer,
    header.idCashSession,
    header.idDeposit,
    header.idPaymentMethod,
    delivery,
    payments,
    paymentTotals.isBalanced,
    isSaleCompleted,
    refreshCashDashboard,
    setValidationErrors,
    submitSale,
  ]);

  const handleOpenProductSearch = useCallback(() => {
    if (isSaleCompleted) {
      toast("La venta ya fue registrada. Inicia una nueva venta para continuar.", {
        id: "sale-completed-warning",
      });
      return;
    }

    if (!header.idDeposit) {
      toast.error("Selecciona un deposito para buscar productos");
      return;
    }

    if (!header.idCashSession) {
      toast.error("Debes abrir una caja antes de registrar una venta");
      return;
    }

    setIsProductModalOpen(true);
  }, [header.idCashSession, header.idDeposit, isSaleCompleted]);

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
      <main className="relative space-y-6 bg-white p-2 md:p-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight">Nueva venta</h1>
        <p className="text-muted-foreground">Carga rapida de venta</p>
      </section>

      {isPreparingSaleView ? (
        <ViewLoadingState
          message="Preparando punto de venta..."
          description="Cargando caja, depositos y configuracion."
        />
      ) : (
        <>
          {saving && (
            <ViewProcessingOverlay
              message="Procesando venta..."
              description="Registrando la operacion y actualizando el stock."
            />
          )}

      <POSHotkeysLegend />

      {!cashLoading && !currentSession && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex flex-col justify-between gap-3 p-4 md:flex-row md:items-center">
            <div>
              <p className="font-semibold text-amber-950">
                Debes abrir una caja antes de registrar una venta.
              </p>
              <p className="text-sm text-amber-900/80">
                El sistema exige que toda venta pertenezca a una sesion de caja abierta.
              </p>
            </div>
            <Button type="button" variant="outline" onClick={() => navigate("/admin/cash")}>
              Ir a caja
            </Button>
          </CardContent>
        </Card>
      )}

      <section className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="grid gap-2">
            <Label>Fecha</Label>
            <Input type="date" value={today} readOnly />
          </div>

          <SearchBox
            label="Cliente"
            value={customerSearch}
            placeholder="Buscar cliente..."
            options={filteredCustomers}
            getKey={(customer) => customer.idCustomer}
            getLabel={(customer) => customer.name}
            onSearchChange={(value) => {
              setCustomerSearch(value);
              updateHeaderField("idCustomer", null);
            }}
            onSelect={handleCustomerSelect}
          />

          <SearchBox
            label="Deposito"
            required
            value={depositSearch}
            placeholder="Buscar deposito..."
            options={filteredDeposits}
            getKey={(deposit) => deposit.idDeposit}
            getLabel={(deposit) => deposit.name}
            onSearchChange={(value) => {
              setDepositSearch(value);
              updateHeaderField("idDeposit", null);
            }}
            onSelect={handleDepositSelect}
            error={getFieldError(fieldErrors, "idDeposit")}
          />
        </div>

        <Card>
          <CardContent className="grid gap-4 p-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <Label className="text-base font-semibold">
                  Pagos <span className="text-destructive">*</span>
                </Label>
                <p className="text-sm text-muted-foreground">
                  Usa un medio de pago o repartí el total entre varios métodos.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPaymentRow}
                disabled={isSaleCompleted || activePaymentMethods.length === 0}
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar otro medio
              </Button>
            </div>

            <div className="grid gap-3">
              {payments.map((payment, index) => {
                const paymentMethodLabel = getPaymentMethodLabel(payment.idPaymentMethod);
                const selectedPaymentMethod = getPaymentMethodById(payment.idPaymentMethod);
                const canBePendingForDelivery = Boolean(
                  delivery.enabled && selectedPaymentMethod?.affectsCash,
                );

                return (
                  <div
                    key={payment.id}
                    className="grid gap-3 rounded-lg border bg-muted/20 p-3 md:grid-cols-[minmax(0,1fr)_180px_190px_auto]"
                  >
                    <div className="grid gap-2">
                      <Label>{index === 0 ? "Medio principal" : "Medio adicional"}</Label>
                      <Select
                        value={payment.idPaymentMethod ? String(payment.idPaymentMethod) : ""}
                        onValueChange={(value: string | null) => {
                          const nextPaymentMethod = activePaymentMethods.find((paymentMethod) => {
                            return paymentMethod.idPaymentMethod === Number(value);
                          });

                          updatePaymentField(
                            payment.id,
                            "idPaymentMethod",
                            value ? Number(value) : null,
                          );

                          if (!nextPaymentMethod?.affectsCash && payment.status === "PENDING") {
                            updatePaymentField(payment.id, "status", "CONFIRMED");
                          }
                        }}
                        disabled={paymentMethodsLoading || activePaymentMethods.length === 0}
                      >
                        <SelectTrigger className="w-full">
                          <span
                            className={
                              paymentMethodLabel
                                ? "flex flex-1 text-left"
                                : "flex flex-1 text-left text-muted-foreground"
                            }
                          >
                            {paymentMethodLabel || "Selecciona un metodo"}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          {activePaymentMethods.map((paymentMethod) => (
                            <SelectItem
                              key={paymentMethod.idPaymentMethod}
                              value={String(paymentMethod.idPaymentMethod)}
                            >
                              {paymentMethod.name} · {paymentMethodTypeLabels[paymentMethod.code]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label>Importe</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={payment.amount}
                        onChange={(event) =>
                          updatePaymentField(
                            payment.id,
                            "amount",
                            event.target.value.replace(",", "."),
                          )
                        }
                        placeholder={index === 0 ? formatMoney(totals.total) : "0.00"}
                        disabled={isSaleCompleted}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label>Estado del pago</Label>
                      <Select
                        value={delivery.enabled ? payment.status : "CONFIRMED"}
                        onValueChange={(value: string | null) => {
                          if (value === "PENDING" || value === "CONFIRMED") {
                            updatePaymentField(payment.id, "status", value);
                          }
                        }}
                        disabled={isSaleCompleted || !delivery.enabled}
                      >
                        <SelectTrigger className="w-full">
                          <span className="flex flex-1 text-left">
                            {delivery.enabled
                              ? getPaymentStatusLabel(payment.status)
                              : "Pagado ahora"}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CONFIRMED">Pagado ahora</SelectItem>
                          <SelectItem
                            value="PENDING"
                            disabled={!canBePendingForDelivery}
                          >
                            Cobra cadete al entregar
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {delivery.enabled && !canBePendingForDelivery && payment.status === "PENDING" ? (
                        <p className="text-xs text-muted-foreground">
                          El cobro en entrega se reserva para medios que afectan caja.
                        </p>
                      ) : null}
                    </div>

                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={payments.length === 1 || isSaleCompleted}
                        onClick={() => removePaymentRow(payment.id)}
                        aria-label="Quitar medio de pago"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid gap-2 rounded-lg bg-muted/30 p-3 text-sm md:grid-cols-3">
              <div>
                <p className="text-muted-foreground">Total</p>
                <p className="font-semibold">{formatMoney(paymentTotals.total)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Asignado</p>
                <p className="font-semibold">{formatMoney(paymentTotals.assigned)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Pendiente</p>
                <p className="font-semibold">{formatMoney(paymentTotals.pending)}</p>
              </div>
            </div>

            {(getFieldError(fieldErrors, "idPaymentMethod") ||
              getFieldError(fieldErrors, "payments")) && (
              <p className="text-sm text-destructive">
                {getFieldError(fieldErrors, "idPaymentMethod") ||
                  getFieldError(fieldErrors, "payments")}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardContent className="grid gap-4 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <Label className="text-base font-semibold">Entrega a domicilio</Label>
                <p className="text-sm text-muted-foreground">
                  Si activas esta opcion, el pago queda pendiente hasta que el cadete cobre y rinda el efectivo.
                </p>
              </div>
              <Switch
                checked={delivery.enabled}
                onCheckedChange={toggleDelivery}
                disabled={isSaleCompleted}
              />
            </div>

            {delivery.enabled && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2 md:col-span-2">
                  <Label>Cadete asignado</Label>
                  <Select
                    value={delivery.assignedToUserId ? String(delivery.assignedToUserId) : "none"}
                    onValueChange={(value: string | null) => {
                      updateDeliveryField(
                        "assignedToUserId",
                        value && value !== "none" ? Number(value) : null,
                      );
                    }}
                    disabled={isSaleCompleted || deliveryUsersLoading}
                  >
                    <SelectTrigger className="w-full">
                      <span
                        className={
                          delivery.assignedToUserId
                            ? "flex flex-1 text-left"
                            : "flex flex-1 text-left text-muted-foreground"
                        }
                      >
                        {delivery.assignedToUserId
                          ? getDeliveryUserLabel(delivery.assignedToUserId)
                          : deliveryUsersLoading
                            ? "Cargando cadetes..."
                            : "Sin asignar por ahora"}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin asignar por ahora</SelectItem>
                      {deliveryUsers.map((user) => (
                        <SelectItem key={user.idUser} value={String(user.idUser)}>
                          {user.name} ({user.username})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {delivery.assignedToUserId ? (
                    <p className="text-xs text-muted-foreground">
                      La entrega aparecera en el panel del cadete seleccionado.
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Si queda sin asignar, el administrador podra asignarla desde entregas.
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label>
                    Destinatario <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={delivery.recipientName}
                    onChange={(event) =>
                      updateDeliveryField("recipientName", event.target.value)
                    }
                    placeholder="Nombre de quien recibe"
                    disabled={isSaleCompleted}
                  />
                  {getFieldError(fieldErrors, "delivery.recipientName") && (
                    <p className="text-sm text-destructive">
                      {getFieldError(fieldErrors, "delivery.recipientName")}
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label>Telefono</Label>
                  <Input
                    value={delivery.recipientPhone}
                    onChange={(event) =>
                      updateDeliveryField("recipientPhone", event.target.value)
                    }
                    placeholder="Telefono de contacto"
                    disabled={isSaleCompleted}
                  />
                </div>

                <div className="grid gap-2 md:col-span-2">
                  <Label>
                    Direccion de entrega <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={delivery.deliveryAddress}
                    onChange={(event) =>
                      updateDeliveryField("deliveryAddress", event.target.value)
                    }
                    placeholder="Calle, numero, piso o referencias"
                    disabled={isSaleCompleted}
                  />
                  {getFieldError(fieldErrors, "delivery.deliveryAddress") && (
                    <p className="text-sm text-destructive">
                      {getFieldError(fieldErrors, "delivery.deliveryAddress")}
                    </p>
                  )}
                </div>

                <div className="grid gap-2 md:col-span-2">
                  <Label>Referencia</Label>
                  <Input
                    value={delivery.deliveryReference}
                    onChange={(event) =>
                      updateDeliveryField("deliveryReference", event.target.value)
                    }
                    placeholder="Entre calles, piso, timbre o referencias para llegar"
                    disabled={isSaleCompleted}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Fecha programada</Label>
                  <Input
                    type="datetime-local"
                    value={delivery.scheduledAt}
                    onChange={(event) =>
                      updateDeliveryField("scheduledAt", event.target.value)
                    }
                    disabled={isSaleCompleted}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Observacion de entrega</Label>
                  <Input
                    value={delivery.observation}
                    onChange={(event) =>
                      updateDeliveryField("observation", event.target.value)
                    }
                    placeholder="Detalle interno para el cadete"
                    disabled={isSaleCompleted}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-2">
          <Label>Observacion</Label>
          <Textarea
            value={header.observation}
            onChange={(event) =>
              updateHeaderField("observation", event.target.value)
            }
            placeholder="Detalle opcional de la venta"
          />
        </div>
      </section>

      <div className="grid gap-2 rounded-lg border bg-muted/30 p-3 md:grid-cols-[1fr_auto] md:items-end">
        <div className="grid gap-2">
          <Label htmlFor="barcode-sale">Escanear codigo de barras</Label>
          <div className="relative">
            <ScanLine className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="barcode-sale"
              ref={barcodeInputRef}
              value={barcodeSearch}
              disabled={!header.idDeposit || !header.idCashSession || isSaleCompleted}
              onChange={(event) => setBarcodeSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleBarcodeSubmit();
                }
              }}
              placeholder={
                header.idDeposit
                  ? "Escanea o ingresa el codigo..."
                  : "Abre caja y selecciona deposito para escanear"
              }
              className="pl-9"
              autoFocus
            />
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={!header.idDeposit || !header.idCashSession || isSaleCompleted || !barcodeSearch.trim()}
          onClick={handleBarcodeSubmit}
        >
          Agregar por codigo
        </Button>
      </div>

      <section className="space-y-3">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <h2 className="text-lg font-semibold">Carrito</h2>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <Button
              type="button"
              disabled={!header.idDeposit || !header.idCashSession || isSaleCompleted}
              onClick={handleOpenProductSearch}
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar productos
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <CartTable
              items={cart}
              errors={fieldErrors}
              onQuantityChange={updateItemQuantity}
              onDiscountPercentChange={updateItemDiscountPercent}
              onRemove={removeFromCart}
            />
          </CardContent>
        </Card>

        {getFieldError(fieldErrors, "items") && (
          <p className="text-sm text-destructive">
            {getFieldError(fieldErrors, "items")}
          </p>
        )}

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex justify-end">
          <div className="grid w-full max-w-sm gap-3">
            <div className="flex items-center justify-between gap-3">
              <Label>Subtotal</Label>
              <span className="font-semibold">
                {formatMoney(totals.subtotal)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <Label>Descuento global (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={header.discountPercent}
                onChange={(event) =>
                  setGlobalDiscountPercent(Number(event.target.value))
                }
                className="w-28 text-right"
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <Label>Monto descuento</Label>
              <span className="font-semibold">
                {formatMoney(totals.discountTotal)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <Label>Total</Label>
              <span className="text-xl font-bold">
                {formatMoney(totals.total)}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={resetSale}>
          Cancelar
        </Button>
        <Button
          type="button"
          disabled={saving || isSaleCompleted || !header.idCashSession || !header.idPaymentMethod}
          onClick={handleSubmit}
        >
          {saving ? "Procesando venta..." : "Registrar venta"}
        </Button>
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
