import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getOrderProductsRequest } from "../api/orders.api";
import { orderMoney, orderRequestError } from "../helpers/orders.helpers";
import type { OrderProductOption, OrderProducts } from "../types/orders.types";
import { OrderProductImage } from "./OrderProductImage";
import { OrderErrorNotice, OrdersPager } from "./OrderUi";

export const OrderProductPicker = ({ idDeposit, selectedIds, disabled, onAdd }: { idDeposit: string; selectedIds: number[]; disabled: boolean; onAdd: (product: OrderProductOption) => void }) => {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState({ search: "", page: 1 });
  const [data, setData] = useState<OrderProducts | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      if (!idDeposit) return;
      setLoading(true); setError(null);
      try { const result = await getOrderProductsRequest(Number(idDeposit), { page: query.page, limit: 10, search: query.search || undefined }, controller.signal); if (!controller.signal.aborted) setData(result.data.data); }
      catch (cause) { if (!controller.signal.aborted) setError(orderRequestError(cause).message); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    };
    void load(); return () => controller.abort();
  }, [idDeposit, query, revision]);
  if (!idDeposit) return <p className="text-sm text-muted-foreground">Seleccioná un depósito para buscar productos.</p>;
  return <div className="space-y-3" aria-busy={loading}>
    <div className="flex flex-wrap gap-2"><Input aria-label="Buscar productos por nombre o código" placeholder="Nombre o código de barras" value={search} maxLength={160} className="min-w-40 flex-1" disabled={disabled} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); setQuery({ search: search.trim(), page: 1 }); } }} /><Button type="button" variant="outline" disabled={disabled || loading} onClick={() => setQuery({ search: search.trim(), page: 1 })}><Search className="size-4" />Buscar</Button></div>
    <p className="text-xs text-muted-foreground">El stock es informativo. Podés pedir sin stock o por encargo; estas cantidades no se reservan.</p>
    {loading && <p role="status" className="text-sm text-muted-foreground">Consultando productos…</p>}
    {error && <OrderErrorNotice message={error} retry={() => setRevision((n) => n + 1)} />}
    {!error && data && <><div className="grid gap-2 md:grid-cols-2">{data.items.map((product) => <div key={product.idProduct} className="flex min-w-0 items-center justify-between gap-3 rounded-lg border p-3"><OrderProductImage imageUrl={product.imageUrl} name={product.name} /><div className="min-w-0 flex-1 space-y-1"><p className="break-words text-sm font-medium">{product.name}</p><p className="break-all text-xs text-muted-foreground">{product.barcode || "Sin código"} · {product.unitType}</p><p className="text-xs">{orderMoney(product.priceSale)} · Stock actual: {product.stockQuantity}</p>{product.saleMode === "on_order" && <p className="text-xs font-medium text-blue-700">Por encargo</p>}</div><Button type="button" size="sm" variant="outline" disabled={disabled || loading || selectedIds.includes(product.idProduct) || selectedIds.length >= 100} onClick={() => onAdd(product)} aria-label={`Agregar ${product.name}`}><Plus className="size-4" />{selectedIds.includes(product.idProduct) ? "Agregado" : "Agregar"}</Button></div>)}</div>{data.items.length === 0 && !loading && <p className="py-4 text-center text-sm text-muted-foreground">No se encontraron productos con esta búsqueda.</p>}<OrdersPager label="Paginación de productos" pagination={data.pagination} disabled={disabled || loading} onPage={(page) => setQuery((current) => ({ ...current, page }))} /></>}
  </div>;
};
