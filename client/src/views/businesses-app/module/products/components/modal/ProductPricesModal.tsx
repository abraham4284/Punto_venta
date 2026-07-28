import { useEffect, useMemo, useState, type FormEvent } from "react";
import { DollarSign } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useForm } from "@/hooks/useForm";
import type {
  FieldError,
  ProductPricesFormValues,
  ProductResponse,
  UpdateProductPricesPayload,
} from "../../types/products.types";

type SubmitResult = {
  status: boolean;
  message: string;
  errors?: FieldError[];
};

type Props = {
  isOpen: boolean;
  product: ProductResponse | null;
  onClose: () => void;
  onSubmit: (
    idProduct: number,
    payload: UpdateProductPricesPayload,
  ) => Promise<SubmitResult>;
};

const initialForm: ProductPricesFormValues = {
  priceCost: "",
  priceSale: "",
  priceWholesale: "",
};

const mapErrorsToRecord = (errors: FieldError[]): Record<string, string> => {
  return errors.reduce<Record<string, string>>((acc, error) => {
    acc[error.field] = error.message;
    return acc;
  }, {});
};

const isInvalidPrice = (value: string): boolean => {
  return (
    value.trim() === "" || !Number.isFinite(Number(value)) || Number(value) < 0
  );
};

export const ProductPricesModal = ({
  isOpen,
  product,
  onClose,
  onSubmit,
}: Props) => {
  const { formSate, onInputChange, setFormSate } =
    useForm<ProductPricesFormValues>(initialForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [initializedProductId, setInitializedProductId] = useState<
    number | null
  >(null);
  const formIsReady =
    !isOpen || !product || initializedProductId === product.idProduct;

  const liveErrors = useMemo(() => {
    const nextErrors: Record<string, string> = {};

    if (isInvalidPrice(formSate.priceCost)) {
      nextErrors.priceCost =
        formSate.priceCost.trim() === ""
          ? "El precio de costo es obligatorio"
          : "El precio de costo no puede ser negativo";
    }

    if (isInvalidPrice(formSate.priceSale)) {
      nextErrors.priceSale =
        formSate.priceSale.trim() === ""
          ? "El precio de venta es obligatorio"
          : "El precio de venta no puede ser negativo";
    }

    return nextErrors;
  }, [formSate.priceCost, formSate.priceSale]);

  const visibleErrors = isOpen && formIsReady
    ? {
        ...liveErrors,
        ...errors,
      }
    : {};

  const canSubmit =
    Boolean(product) &&
    formIsReady &&
    Object.keys(liveErrors).length === 0 &&
    !saving;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (!product || !isOpen) {
        setFormSate(initialForm);
        setErrors({});
        setInitializedProductId(null);
        return;
      }

      setInitializedProductId(null);
      setFormSate({
        priceCost: String(product.priceCost),
        priceSale: String(product.priceSale),
        priceWholesale:
          product.priceWholesale === null ||
          product.priceWholesale === undefined
            ? ""
            : String(product.priceWholesale),
      });
      setErrors({});
      setInitializedProductId(product.idProduct);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [isOpen, product, setFormSate]);

  const handleOpenChange = (open: boolean) => {
    if (open) return;

    setErrors({});
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!product || Object.keys(liveErrors).length > 0) {
      setErrors(liveErrors);
      return;
    }

    try {
      setSaving(true);
      setErrors({});

      const payload: UpdateProductPricesPayload = {
        priceCost: Number(formSate.priceCost),
        priceSale: Number(formSate.priceSale),
        priceWholesale:
          formSate.priceWholesale.trim() === ""
            ? null
            : Number(formSate.priceWholesale),
      };

      const result = await onSubmit(product.idProduct, payload);

      if (!result.status) {
        if (result.errors) {
          setErrors(mapErrorsToRecord(result.errors));
        }
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              Ajustar precios
            </DialogTitle>
          </DialogHeader>

          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Producto seleccionado
              </p>
              <div className="flex min-w-0 items-center gap-3 pt-2">
                <img
                  src={product?.imageUrl ?? "/images/no-image.png"}
                  alt={product?.name ?? "Sin producto seleccionado"}
                  className="h-14 w-14 rounded-md border object-cover"
                />
                <p className="mt-1 text-base font-semibold">
                  {product?.name ?? "Sin producto seleccionado"}
                </p>
              </div>
            </div>

            {!formIsReady ? (
              <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                <Spinner className="h-4 w-4" />
                Cargando precios del producto...
              </div>
            ) : (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="quickPriceCost">Precio de Costo ($)</Label>
                  <Input
                    id="quickPriceCost"
                    name="priceCost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formSate.priceCost}
                    disabled={saving}
                    aria-invalid={Boolean(visibleErrors.priceCost)}
                    onChange={(event) => {
                      onInputChange(event);
                      setErrors((currentErrors) => {
                        const nextErrors = { ...currentErrors };
                        delete nextErrors.priceCost;
                        return nextErrors;
                      });
                    }}
                  />
                  {visibleErrors.priceCost && (
                    <p className="text-sm text-destructive">
                      {visibleErrors.priceCost}
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="quickPriceSale">Precio de Venta ($)</Label>
                  <Input
                    id="quickPriceSale"
                    name="priceSale"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formSate.priceSale}
                    disabled={saving}
                    aria-invalid={Boolean(visibleErrors.priceSale)}
                    onChange={(event) => {
                      onInputChange(event);
                      setErrors((currentErrors) => {
                        const nextErrors = { ...currentErrors };
                        delete nextErrors.priceSale;
                        return nextErrors;
                      });
                    }}
                  />
                  {visibleErrors.priceSale && (
                    <p className="text-sm text-destructive">
                      {visibleErrors.priceSale}
                    </p>
                  )}
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => handleOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={!canSubmit}>
                {saving && <Spinner className="mr-2 h-4 w-4" />}
                Guardar precios
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Toaster position="top-right" reverseOrder={false} />
    </>
  );
};
