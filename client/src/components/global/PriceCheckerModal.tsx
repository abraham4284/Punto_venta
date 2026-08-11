import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Barcode, ImageIcon, Search, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { getProductsRequest } from "@/views/businesses-app/module/products/api/products.api";
import type { ProductResponse } from "@/views/businesses-app/module/products/types/products.types";
import { usePriceCheckerStore } from "@/store/priceChecker.store";

const formatMoney = (value: number): string => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(value);
};

const normalizeText = (value: string): string => {
  return value.trim().toLowerCase();
};

const getCategoryName = (product: ProductResponse): string => {
  return (
    product.productCategoryName ||
    product.categoryName ||
    "Sin categoria"
  );
};

const ProductResultCard = ({ product }: { product: ProductResponse }) => {
  return (
    <article className="grid gap-4 rounded-xl border bg-background p-4 shadow-sm md:grid-cols-[88px_1fr_auto] md:items-center">
      <div className="h-22 w-22 overflow-hidden rounded-xl bg-muted">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageIcon className="h-7 w-7" />
          </div>
        )}
      </div>

      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-lg font-semibold">{product.name}</h3>
          <Badge variant="secondary">{getCategoryName(product)}</Badge>
          <Badge variant={product.isActive ? "default" : "destructive"}>
            {product.isActive ? "Activo" : "Inactivo"}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Barcode className="h-4 w-4" />
            {product.barcode || "Sin codigo"}
          </span>
          <span>Stock actual: {product.stock}</span>
        </div>
      </div>

      <div className="rounded-xl bg-emerald-50 px-4 py-3 text-left md:text-right">
        <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
          Precio venta
        </p>
        <p className="text-3xl font-bold text-emerald-700">
          {formatMoney(product.priceSale)}
        </p>
      </div>
    </article>
  );
};

export const PriceCheckerModal = () => {
  const isOpen = usePriceCheckerStore((state) => state.isOpen);
  const closePriceChecker = usePriceCheckerStore(
    (state) => state.closePriceChecker,
  );
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestSequenceRef = useRef(0);

  const loadProducts = useCallback(async (searchValue: string) => {
    const trimmedSearch = searchValue.trim();
    const requestId = requestSequenceRef.current + 1;

    requestSequenceRef.current = requestId;

    if (!trimmedSearch) {
      setProducts([]);
      setError(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await getProductsRequest({
        page: 1,
        limit: 6,
        search: trimmedSearch,
        isActive: true,
      });

      if (requestId !== requestSequenceRef.current) return;

      setProducts(response.data.data.items ?? []);
    } catch {
      if (requestId !== requestSequenceRef.current) return;

      setError("No se pudieron cargar los productos");
    } finally {
      if (requestId === requestSequenceRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const timeoutId = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const timeoutId = window.setTimeout(() => {
      void loadProducts(query);
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isOpen, loadProducts, query]);

  const filteredProducts = useMemo(() => {
    const value = normalizeText(query);

    if (!value) return [];

    const exactBarcodeProduct = products.find((product) => {
      return product.barcode?.trim().toLowerCase() === value;
    });

    if (exactBarcodeProduct) return [exactBarcodeProduct];

    return products
      .filter((product) => {
        return (
          product.name.toLowerCase().includes(value) ||
          product.barcode?.toLowerCase().includes(value)
        );
      })
      .slice(0, 6);
  }, [products, query]);

  const handleClose = () => {
    setQuery("");
    setProducts([]);
    setError(null);
    closePriceChecker();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            Consulta rapida de precios
          </DialogTitle>
          <DialogDescription>
            Busca por nombre o escanea el codigo de barras del producto.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nombre o codigo de barras..."
              className="h-11 pl-9 text-base"
              autoFocus
            />
          </div>

          {loading && (
            <div className="flex items-center justify-center rounded-xl border bg-muted/30 p-8">
              <Spinner />
            </div>
          )}

          {!loading && error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          {!loading && !error && query.trim() && filteredProducts.length === 0 && (
            <div className="rounded-xl border bg-muted/30 p-8 text-center text-muted-foreground">
              No se encontro ningun producto con esa busqueda.
            </div>
          )}

          {!loading && filteredProducts.length > 0 && (
            <div className="grid gap-3">
              {filteredProducts.map((product) => (
                <ProductResultCard key={product.idProduct} product={product} />
              ))}
            </div>
          )}

          <div className="flex flex-col justify-between gap-2 border-t pt-3 text-xs text-muted-foreground sm:flex-row sm:items-center">
            <span>Atajo disponible en todo el panel: F8</span>
            <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
              Presiona ESC para cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
