import { useCallback, useEffect, useMemo, useState } from "react";
import { Minus, Plus, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  PriceType,
  ProductUnitType,
  ProductSelection,
  ProductWithStockResponse,
} from "../../types";
import { PRODUCT_UNIT_TYPE_OPTIONS } from "../../types";

type Props = {
  isOpen: boolean;
  products: ProductWithStockResponse[];
  priceType: PriceType;
  loading: boolean;
  onClose: () => void;
  onConfirm: (items: ProductSelection[]) => void;
};

const MIN_SEARCH_LENGTH = 2;
const MAX_VISIBLE_PRODUCTS = 24;

const formatMoney = (value: number): string => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(value);
};

const getPrice = (
  product: ProductWithStockResponse,
  priceType: PriceType,
): number => {
  if (
    priceType === "WHOLESALE" &&
    product.priceWholesale !== null &&
    product.priceWholesale > 0
  ) {
    return product.priceWholesale;
  }

  return product.priceSale;
};

const cannotUseWholesale = (
  product: ProductWithStockResponse,
  priceType: PriceType,
): boolean => {
  return (
    priceType === "WHOLESALE" &&
    (product.priceWholesale === null || product.priceWholesale <= 0)
  );
};

const getUnitOption = (unitType: ProductUnitType) => {
  return PRODUCT_UNIT_TYPE_OPTIONS.find((option) => {
    return option.value === unitType;
  });
};

const getQuantityStep = (unitType: ProductUnitType): number => {
  return unitType === "UNIT" ? 1 : 0.01;
};

const normalizeQuantity = (
  value: number,
  product: ProductWithStockResponse,
): number => {
  if (!Number.isFinite(value)) return 0;

  const boundedQuantity = Math.min(Math.max(value, 0), product.stockQuantity);

  if (product.unitType === "UNIT") {
    return Math.floor(boundedQuantity);
  }

  return Number(boundedQuantity.toFixed(2));
};

export const ProductSelectionModal = ({
  isOpen,
  products,
  priceType,
  loading,
  onClose,
  onConfirm,
}: Props) => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  const filteredProducts = useMemo(() => {
    const value = debouncedSearch.trim().toLowerCase();

    if (value.length < MIN_SEARCH_LENGTH) return [];

    return products
      .filter((product) => {
        return (
          product.name.toLowerCase().includes(value) ||
          product.barcode?.toLowerCase().includes(value)
        );
      })
      .slice(0, MAX_VISIBLE_PRODUCTS);
  }, [products, debouncedSearch]);

  const hasEnoughSearch = debouncedSearch.trim().length >= MIN_SEARCH_LENGTH;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search);
    }, 180);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  const updateQuantity = (product: ProductWithStockResponse, value: number) => {
    const nextQuantity = normalizeQuantity(value, product);

    setQuantities((current) => ({
      ...current,
      [product.idProduct]: nextQuantity,
    }));
  };

  const resetModalState = useCallback(() => {
    setSearch("");
    setDebouncedSearch("");
    setQuantities({});
  }, []);

  const handleClose = useCallback(() => {
    resetModalState();
    onClose();
  }, [onClose, resetModalState]);

  const handleConfirm = () => {
    const selectedItems = products
      .map((product) => ({
        product,
        quantity: quantities[product.idProduct] ?? 0,
      }))
      .filter((item) => item.quantity > 0);

    onConfirm(selectedItems);
    resetModalState();
  };

  const selectedCount = Object.values(quantities).filter(
    (quantity) => quantity > 0,
  ).length;

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4"
      role="presentation"
      onMouseDown={handleClose}
    >
      <section
        aria-modal="true"
        role="dialog"
        aria-labelledby="product-selection-title"
        className="grid max-h-[88vh] w-full max-w-3xl gap-4 overflow-hidden rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 shadow-lg"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <h2
            id="product-selection-title"
            className="font-heading text-base leading-none font-medium"
          >
            Selecciona productos
          </h2>
          <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre o codigo..."
            className="pl-9"
          />
        </div>

        <div className="max-h-[58vh] overflow-y-auto pr-2">
          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Cargando productos...
            </div>
          ) : !hasEnoughSearch ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Escribi al menos {MIN_SEARCH_LENGTH} caracteres para buscar
              productos.
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No se encontraron productos disponibles para esta busqueda.
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Mostrando hasta {MAX_VISIBLE_PRODUCTS} resultados. Afina la
                busqueda si no ves el producto.
              </p>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => {
                const quantity = quantities[product.idProduct] ?? 0;
                const withoutWholesale = cannotUseWholesale(product, priceType);
                const disabled = product.stockQuantity <= 0 || withoutWholesale;
                const unitOption = getUnitOption(product.unitType);
                const quantityStep = getQuantityStep(product.unitType);

                return (
                  <article
                    key={product.idProduct}
                    className={`overflow-hidden rounded-lg border bg-card shadow-sm ${
                      disabled ? "opacity-50" : ""
                    }`}
                  >
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        loading="lazy"
                        decoding="async"
                        className="h-36 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-36 w-full items-center justify-center bg-muted text-sm text-muted-foreground">
                        Sin imagen
                      </div>
                    )}

                    <div className="grid gap-3 p-3">
                      <div>
                        <h3 className="line-clamp-2 font-semibold">
                          {product.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {withoutWholesale
                            ? "Sin precio mayorista"
                            : formatMoney(getPrice(product, priceType))}
                        </p>
                      </div>

                      <Badge variant="secondary" className="w-fit">
                        Stock en deposito: {product.stockQuantity}{" "}
                        {unitOption?.shortLabel ?? "u."}
                      </Badge>

                      <Badge variant="outline" className="w-fit">
                        Venta por {unitOption?.label.toLowerCase() ?? "unidad"}
                      </Badge>

                      <div className="grid grid-cols-[36px_1fr_36px] gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={disabled || quantity <= 0}
                          onClick={() =>
                            updateQuantity(product, quantity - quantityStep)
                          }
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          min="0"
                          max={product.stockQuantity}
                          step={quantityStep}
                          disabled={disabled}
                          value={quantity}
                          onChange={(event) =>
                            updateQuantity(product, Number(event.target.value))
                          }
                          className="text-center"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={disabled || quantity >= product.stockQuantity}
                          onClick={() =>
                            updateQuantity(product, quantity + quantityStep)
                          }
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={selectedCount === 0}
            onClick={handleConfirm}
          >
            Agregar al carrito
          </Button>
        </div>
      </section>
    </div>
  );
};
