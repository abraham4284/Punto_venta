import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PRODUCT_UNIT_TYPE_OPTIONS } from "../../../products/types/products.types";
import { getAdvancedStockInventoryRequest } from "../../api/stock.api";
import { canAddTransferProduct } from "../../helpers/stock-transfer.helper";
import type { AdvancedStockInventoryItem, AdvancedStockResponse } from "../../types/stock.types";

interface Props {
  origin: number;
  addedIds: ReadonlySet<number>;
  atLimit: boolean;
  disabled: boolean;
  onAdd: (product: AdvancedStockInventoryItem) => void;
}

const formatQuantity = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 });

export const StockTransferProductPicker = ({ origin, addedIds, atLimit, disabled, onAdd }: Props) => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; data: AdvancedStockResponse | null } | null>(null);
  const key = JSON.stringify([origin, search, page, attempt]);
  const current = result?.key === key ? result : null;

  useEffect(() => {
    if (!origin) return;
    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        const { data } = await getAdvancedStockInventoryRequest({
          idDeposit: origin, search, page, limit: 8,
          minQuantity: 0.01, maxQuantity: null, quantity: null, alertStatus: null,
        });
        if (active) setResult({ key, data: data.data });
      } catch {
        if (active) setResult({ key, data: null });
      }
    }, 200);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [key, origin, page, search]);

  const products = current?.data?.stock.filter((product) => canAddTransferProduct(product, origin)) ?? [];
  const totalPages = current?.data?.pagination.totalPages ?? 0;

  return (
    <section className="space-y-2">
      <Label htmlFor="transfer-product-search">Buscar productos en origen</Label>
      <div className="relative">
        <Search aria-hidden="true" className="absolute top-2 left-2.5 size-4 text-muted-foreground" />
        <Input
          id="transfer-product-search"
          className="pl-8"
          placeholder="Nombre o código de barras"
          maxLength={160}
          disabled={!origin || disabled}
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          onKeyDown={(event) => { if (event.key === "Enter") event.preventDefault(); }}
        />
      </div>
      {!origin && <p className="text-muted-foreground">Seleccioná el depósito origen para buscar.</p>}
      {origin > 0 && !current && <p role="status" className="text-muted-foreground">Buscando productos…</p>}
      {current && !current.data && (
        <div className="flex flex-wrap items-center gap-2">
          <p role="alert" className="text-destructive">No se pudo consultar el stock del origen.</p>
          <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={() => setAttempt(attempt + 1)}>
            Volver a buscar
          </Button>
        </div>
      )}
      {current?.data && products.length === 0 && (
        <p className="text-muted-foreground">Esta página no tiene productos activos con stock.</p>
      )}
      {products.length > 0 && (
        <ul className="max-h-48 divide-y overflow-y-auto rounded-lg border" aria-label="Resultados de productos">
          {products.map((product) => {
            const added = addedIds.has(product.idProduct);
            const unit = PRODUCT_UNIT_TYPE_OPTIONS.find(({ value }) => value === product.unitType)?.shortLabel;
            return (
              <li key={product.idProduct} className="flex items-center justify-between gap-2 px-3 py-2">
                <div className="min-w-0">
                  <p className="break-words font-medium">{product.productName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatQuantity.format(product.quantity)} {unit} disponibles
                    {product.barcode && <span className="break-all"> · {product.barcode}</span>}
                  </p>
                </div>
                <Button
                  type="button" size="sm" variant="outline"
                  aria-label={added ? `${product.productName} agregado` : `Agregar ${product.productName}`}
                  disabled={disabled || added || atLimit}
                  onClick={() => onAdd(product)}
                >
                  {!added && <Plus aria-hidden="true" className="size-4" />}
                  {added ? "Agregado" : "Agregar"}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
      {(totalPages > 1 || page > 1) && (
        <div className="flex items-center justify-between gap-2">
          <Button type="button" variant="outline" size="sm" disabled={disabled || page === 1} onClick={() => setPage(page - 1)}>
            Anterior
          </Button>
          <span aria-live="polite">Página {page}{totalPages > 0 && ` de ${totalPages}`}</span>
          <Button type="button" variant="outline" size="sm" disabled={disabled || page >= totalPages} onClick={() => setPage(page + 1)}>
            Siguiente
          </Button>
        </div>
      )}
    </section>
  );
};
