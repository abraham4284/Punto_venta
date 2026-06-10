import { useEffect, useMemo, useState } from "react";
import { ChevronsUpDown, Plus, Search } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast, Toaster } from "react-hot-toast";
import type { Customer } from "../../customers/types/customers.types";
import { useCustomers } from "../../customers/hooks/useCustomers";
import type { DepositResponse } from "../../deposits/types/deposits.types";
import { useDeposits } from "../../deposits/hooks/useDeposits";
import { CartTable, ProductSelectionModal } from "../components";
import { useSales } from "../hooks/useSales";
import type { PaymentMethodOption, PriceType } from "../types";
import { createSaleFormSchema } from "../validations/sales.validations";

const paymentMethods: PaymentMethodOption[] = [
  { idPaymentMethod: 1, name: "Efectivo" },
];

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

type SearchBoxProps<T> = {
  label: string;
  required?: boolean;
  value: string;
  placeholder: string;
  options: T[];
  getKey: (option: T) => number;
  getLabel: (option: T) => string;
  onSearchChange: (value: string) => void;
  onSelect: (option: T) => void;
  error?: string;
};

const SearchBox = <T,>({
  label,
  required,
  value,
  placeholder,
  options,
  getKey,
  getLabel,
  onSearchChange,
  onSelect,
  error,
}: SearchBoxProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="grid gap-2">
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <div
        className="relative"
        onBlur={() => {
          window.setTimeout(() => setIsOpen(false), 120);
        }}
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          onChange={(event) => {
            onSearchChange(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="pl-9 pr-9"
        />
        <ChevronsUpDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

        {isOpen && (
          <div className="absolute z-50 mt-2 max-h-64 w-full overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
            {options.length > 0 ? (
              options.map((option) => (
                <button
                  key={getKey(option)}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onSelect(option);
                    setIsOpen(false);
                  }}
                  className="flex w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                >
                  {getLabel(option)}
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                Sin resultados
              </p>
            )}
          </div>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
};

export const SalesPage = () => {
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [depositSearch, setDepositSearch] = useState("");
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
    setPriceType,
    updateHeaderField,
    changeDeposit,
    addToCart,
    removeFromCart,
    updateItemQuantity,
    updateItemDiscountPercent,
    setGlobalDiscountPercent,
    submitSale,
    setValidationErrors,
    clearCart,
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
  }, [getCustomers, getDeposits]);

  const handleCustomerSelect = (customer: Customer) => {
    updateHeaderField("idCustomer", customer.idCustomer);
    setCustomerSearch(customer.name);
  };

  const handleDepositSelect = async (deposit: DepositResponse) => {
    const changed = await changeDeposit(deposit.idDeposit);

    if (changed) {
      setDepositSearch(deposit.name);
    }
  };

  const resetSale = () => {
    setCustomerSearch("");
    setDepositSearch("");
    clearCart();
  };

  const handleSubmit = async () => {
    try {
      createSaleFormSchema.parse({
        idCustomer: header.idCustomer,
        idDeposit: header.idDeposit,
        idPaymentMethod: header.idPaymentMethod,
        items: cart.map((item) => ({
          idProduct: item.idProduct,
          quantity: item.quantity,
          stockQuantity: item.stockQuantity,
          unitPrice: item.unitPrice,
          discount: item.discountAmount,
          total: item.total,
        })),
      });

      const { status, message } = await submitSale();
      if (status) {
        toast.success(message);
      } else {
        toast.error(message);
      }
      setCustomerSearch("");
      setDepositSearch("");
    } catch (error) {
      if (error instanceof z.ZodError) {
        setValidationErrors(mapZodErrors(error));
      }
    }
  };

  return (
    <main className="space-y-6 bg-white p-2 md:p-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight">Nueva venta</h1>
        <p className="text-muted-foreground">Carga rapida de venta</p>
      </section>

      <section className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="grid gap-2">
            <Label>Fecha</Label>
            <Input type="date" value={today} readOnly />
          </div>

          <SearchBox
            label="Cliente"
            required
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
            error={getFieldError(fieldErrors, "idCustomer")}
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

      <section className="space-y-3">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <h2 className="text-lg font-semibold">Carrito</h2>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex items-center gap-2">
              <Label className="whitespace-nowrap">Tipo de precio:</Label>
              <Select
                value={priceType}
                onValueChange={(value) =>
                  value && setPriceType(value as PriceType)
                }
              >
                <SelectTrigger className="w-44">
                  <SelectValue>
                    {priceType === "SALE"
                      ? "Precio de venta"
                      : "Precio mayorista"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="SALE">Precio de venta</SelectItem>
                    <SelectItem value="WHOLESALE">Precio mayorista</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="button"
              disabled={!header.idDeposit}
              onClick={() => setIsProductModalOpen(true)}
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
              transactionDate={today}
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

      <ProductSelectionModal
        isOpen={isProductModalOpen}
        products={products}
        priceType={priceType}
        loading={loadingProducts}
        onClose={() => setIsProductModalOpen(false)}
        onConfirm={(items) => {
          addToCart(items);
          setIsProductModalOpen(false);
        }}
      />
      <Toaster position="top-right" reverseOrder={false} />
    </main>
  );
};
