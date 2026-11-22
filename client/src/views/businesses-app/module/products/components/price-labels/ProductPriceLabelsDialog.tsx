import { useEffect, useRef, useState } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getProductPriceLabelsRequest } from "../../api/products.api";
import { defaultPriceLabelContent, priceLabelsError } from "../../helpers/product-price-labels.helper";
import type { PriceLabelContent, PriceLabelsSnapshot } from "../../helpers/product-price-labels.helper";
import type { ProductPriceLabelsQuery } from "../../types/products.types";
import { ProductPriceLabelsPrintDocument, ProductPriceLabelsSheets } from "./ProductPriceLabelsPrintDocument";

type Props = {
  selectedIds: ReadonlySet<number>;
  filters: ProductPriceLabelsQuery;
  businessName: string;
};
const contentLabels: Record<keyof PriceLabelContent, string> = {
  name: "Nombre", retail: "Precio minorista", wholesale: "Precio mayorista", barcode: "Código / barcode", category: "Categoría",
};

const PriceLabelsConfiguration = ({ selectedIds, filters, businessName }: Props) => {
  const [scope, setScope] = useState<"selected" | "filtered">(selectedIds.size ? "selected" : "filtered");
  const [content, setContent] = useState({ ...defaultPriceLabelContent });
  const [snapshot, setSnapshot] = useState<PriceLabelsSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);

  const prepare = async () => {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setMessage("");
    setSnapshot(null);
    try {
      if (scope === "selected" && (!selectedIds.size || selectedIds.size > 2000)) {
        setMessage("Seleccioná entre 1 y 2.000 productos para preparar las etiquetas.");
        return;
      }
      const query = scope === "selected" ? { ids: [...selectedIds] } : {
        search: filters.search, idProductCategory: filters.idProductCategory, isActive: filters.isActive,
      };
      const { data: { data } } = await getProductPriceLabelsRequest(query, controller.signal);
      if (controller.signal.aborted) return;
      if (!Array.isArray(data.items) || data.totalRecords !== data.items.length || data.totalRecords > 2000) {
        setMessage("La respuesta de productos está incompleta. Volvé a preparar las etiquetas.");
      } else if (!data.items.length) {
        setMessage("No hay productos para esta selección o filtros.");
      } else {
        setSnapshot({ items: data.items, businessName, content: { ...content } });
      }
    } catch (error) {
      if (!controller.signal.aborted) setMessage(priceLabelsError(error));
    } finally {
      if (!controller.signal.aborted) {
        request.current = null;
        setLoading(false);
      }
    }
  };

  return (
    <>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Etiquetas de precios</DialogTitle>
          <DialogDescription>Configurá las etiquetas y prepará los precios actuales antes de imprimir.</DialogDescription>
        </DialogHeader>
        <fieldset disabled={loading} className="grid gap-3">
          <legend className="mb-2 text-sm font-medium">Productos</legend>
          <label className="flex items-start gap-2 text-sm">
            <input type="radio" name="price-label-scope" checked={scope === "selected"} disabled={!selectedIds.size}
              onChange={() => { setScope("selected"); setSnapshot(null); }} className="mt-0.5" />
            Productos seleccionados ({selectedIds.size})
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input type="radio" name="price-label-scope" checked={scope === "filtered"}
              onChange={() => { setScope("filtered"); setSnapshot(null); }} className="mt-0.5" />
            Todos los productos que coinciden con los filtros actuales
          </label>
        </fieldset>
        <fieldset disabled={loading} className="grid grid-cols-2 gap-3">
          <legend className="mb-2 text-sm font-medium">Contenido</legend>
          {(Object.keys(contentLabels) as (keyof PriceLabelContent)[]).map((key) => (
            <label key={key} className="flex items-start gap-2 text-sm">
              <input type="checkbox" checked={content[key]} className="mt-0.5"
                onChange={(event) => {
                  setContent((current) => ({ ...current, [key]: event.target.checked }));
                  setSnapshot(null);
                }} />
              {contentLabels[key]}
            </label>
          ))}
        </fieldset>
        <p className="text-sm text-muted-foreground">A4 vertical · 3 × 7 · 21 etiquetas por hoja</p>
        {loading && <p role="status">Preparando etiquetas…</p>}
        {message && <p role="status">{message}</p>}
        {snapshot && (
          <div className="grid justify-items-center gap-2">
            <p role="status" className="text-sm">{snapshot.items.length} etiquetas listas · {Math.ceil(snapshot.items.length / 21)} hojas</p>
            <div className="price-label-preview" aria-label="Vista de la primera etiqueta">
              <ProductPriceLabelsSheets snapshot={{ ...snapshot, items: snapshot.items.slice(0, 1) }} />
            </div>
          </div>
        )}
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>Cancelar</DialogClose>
          <Button type="button" disabled={loading || !Object.values(content).some(Boolean)} onClick={() => void prepare()}>
            {loading ? "Preparando…" : snapshot ? "Volver a preparar" : "Preparar impresión"}
          </Button>
          {snapshot && <Button type="button" onClick={() => window.print()}>
            <Printer aria-hidden="true" className="size-4" /> Imprimir / Guardar PDF
          </Button>}
        </DialogFooter>
      </DialogContent>
      {snapshot && <ProductPriceLabelsPrintDocument snapshot={snapshot} />}
    </>
  );
};

export const ProductPriceLabelsDialog = (props: Props) => {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="outline" />}>
        <Printer aria-hidden="true" className="size-4" /> Imprimir etiquetas
      </DialogTrigger>
      {open && <PriceLabelsConfiguration {...props} />}
    </Dialog>
  );
};
