import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, ScanLine } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Meta } from "@/components/Meta";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast, Toaster } from "react-hot-toast";
import type { Customer } from "../../customers/types/customers.types";
import { useCustomers } from "../../customers/hooks/useCustomers";
import type { DepositResponse } from "../../deposits/types/deposits.types";
import { useDeposits } from "../../deposits/hooks/useDeposits";
import {
  CartTable,
  POSHotkeysLegend,
  SearchProductModal,
  SaleSuccessModal,
  SearchBox,
} from "../components";
import { useSalesHotkeys } from "../hooks/useSalesHotkeys";
import { useSales } from "../hooks/useSales";
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
  const defaultDepositWasSelected = useRef(false);
  const barcodeInputRef = useRef<HTMLInputElement | null>(null);
  const { customers, getCustomers, resetCustomers } = useCustomers();
  const { deposits, getDeposits, resetDeposits } = useDeposits();
  const {
    header,
    cart,
    products,
    totals,
    priceType,
    loadingProducts,
    saving,
    error,
    fieldErrors,
    isOpenSuccessModal,
    newSaleId,
    newSaleNumber,
    updateHeaderField,
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

  useEffect(() => {
    getCustomers();
    getDeposits();
    return () => {
      resetCustomers();
      resetDeposits();
    };
  }, [getCustomers, getDeposits, resetCustomers, resetDeposits]);

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

    defaultDepositWasSelected.current = true;

    const timeoutId = window.setTimeout(() => {
      void handleDepositSelect(defaultDeposit);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [deposits, header.idDeposit, depositSearch, handleDepositSelect]);

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
    const barcode = barcodeSearch.trim();

    if (!barcode) return;

    if (!header.idDeposit) {
      toast.error("Selecciona un deposito para escanear productos");
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
  }, [addToCart, barcodeSearch, cart, header.idDeposit, loadingProducts, priceType, products]);

  const handleSubmit = useCallback(async () => {
    try {
      createSaleFormSchema.parse({
        idCustomer: header.idCustomer ? header.idCustomer : null,
        idDeposit: header.idDeposit,
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
      });

      const { status, message } = await submitSale();
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
    header.idCustomer,
    header.idDeposit,
    header.idPaymentMethod,
    setValidationErrors,
    submitSale,
  ]);

  const handleOpenProductSearch = useCallback(() => {
    if (!header.idDeposit) {
      toast.error("Selecciona un deposito para buscar productos");
      return;
    }

    setIsProductModalOpen(true);
  }, [header.idDeposit]);

  useSalesHotkeys({
    onOpenSearch: handleOpenProductSearch,
    onFinalizeSale: () => {
      void handleSubmit();
    },
    isCartEmpty: cart.length === 0,
    isLoading: saving,
  });

  return (
    <>
      <Meta title="Nueva Venta" />
      <main className="space-y-6 bg-white p-2 md:p-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight">Nueva venta</h1>
        <p className="text-muted-foreground">Carga rapida de venta</p>
      </section>

      <POSHotkeysLegend />

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
              disabled={!header.idDeposit}
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
                  : "Selecciona un deposito para escanear"
              }
              className="pl-9"
              autoFocus
            />
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={!header.idDeposit || !barcodeSearch.trim()}
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
              disabled={!header.idDeposit}
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
        <Button type="button" disabled={saving} onClick={handleSubmit}>
          {saving ? "Procesando..." : "Registrar venta"}
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
      <Toaster position="top-right" reverseOrder={false} />
      </main>
    </>
  );
};
