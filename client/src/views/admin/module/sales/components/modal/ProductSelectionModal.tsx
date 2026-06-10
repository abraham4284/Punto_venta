import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type {
  PriceType,
  ProductSelection,
  ProductWithStockResponse,
} from "../../types";

type Props = {
  isOpen: boolean;
  products: ProductWithStockResponse[];
  priceType: PriceType;
  loading: boolean;
  onClose: () => void;
  onConfirm: (items: ProductSelection[]) => void;
};

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

export const ProductSelectionModal = ({
  isOpen,
  products,
  priceType,
  loading,
  onClose,
  onConfirm,
}: Props) => {
  const [search, setSearch] = useState("");
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  const filteredProducts = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return products;

    return products.filter((product) => {
      return (
        product.name.toLowerCase().includes(value) ||
        product.barcode?.toLowerCase().includes(value)
      );
    });
  }, [products, search]);

  useEffect(() => {
    if (!isOpen) {
      setSearch("");
      setQuantities({});
    }
  }, [isOpen]);

  const updateQuantity = (product: ProductWithStockResponse, value: number) => {
    const nextQuantity = Math.min(Math.max(value, 0), product.stockQuantity);

    setQuantities((current) => ({
      ...current,
      [product.idProduct]: nextQuantity,
    }));
  };

  const handleConfirm = () => {
    const selectedItems = products
      .map((product) => ({
        product,
        quantity: quantities[product.idProduct] ?? 0,
      }))
      .filter((item) => item.quantity > 0);

    onConfirm(selectedItems);
    setQuantities({});
    setSearch("");
  };

  const selectedCount = Object.values(quantities).filter(
    (quantity) => quantity > 0,
  ).length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[88vh] overflow-hidden sm:max-w-3xl">
        <DialogHeader className="flex-row items-center justify-between">
          <DialogTitle>Selecciona productos</DialogTitle>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre..."
            className="pl-9"
          />
        </div>

        <div className="max-h-[58vh] overflow-y-auto pr-2">
          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Cargando productos...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No hay productos disponibles para este deposito.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => {
                const quantity = quantities[product.idProduct] ?? 0;
                const withoutWholesale = cannotUseWholesale(product, priceType);
                const disabled = product.stockQuantity <= 0 || withoutWholesale;

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
                        Stock en deposito: {product.stockQuantity}
                      </Badge>

                      <div className="grid grid-cols-[36px_1fr_36px] gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={disabled || quantity <= 0}
                          onClick={() => updateQuantity(product, quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          min="0"
                          max={product.stockQuantity}
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
                          onClick={() => updateQuantity(product, quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
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
      </DialogContent>
    </Dialog>
  );
};
