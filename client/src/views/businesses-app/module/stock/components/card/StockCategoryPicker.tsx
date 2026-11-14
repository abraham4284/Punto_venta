import { useRef, useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { STOCK_CATEGORY_LIMIT } from "../../helpers/stock-inventory.helper";
import type { useStockCategoryOptions } from "../../hooks/useStockCategoryOptions";

type Props = {
  value: number[];
  onChange: (value: number[]) => void;
  categories: ReturnType<typeof useStockCategoryOptions>;
};

export const StockCategoryPicker = ({ value, onChange, categories }: Props) => {
  const { options, error, loading, retry } = categories;
  const [search, setSearch] = useState("");
  const [limitReached, setLimitReached] = useState(false);
  const searchInput = useRef<HTMLInputElement>(null);
  const selected = new Set(value);
  const query = search.trim().toLocaleLowerCase("es-AR");
  const visible = options.filter(({ name }) => name.toLocaleLowerCase("es-AR").includes(query));
  const summary = value.length === 1
    ? options.find(({ idProductCategory }) => idProductCategory === value[0])?.name ?? "1 categoría"
    : value.length ? `${value.length} categorías` : "Todas las categorías";

  const toggleCategory = (id: number) => {
    if (!selected.has(id) && value.length >= STOCK_CATEGORY_LIMIT) {
      setLimitReached(true);
      return;
    }
    setLimitReached(false);
    onChange(selected.has(id) ? value.filter((current) => current !== id) : [...value, id]);
  };

  return (
    <div className="grid min-w-0 gap-2">
      <span className="text-sm font-medium" id="stock-category-label">Categorías</span>
      <Popover.Root onOpenChange={(open) => {
        if (!open) {
          setSearch("");
          setLimitReached(false);
        }
      }}>
        <Popover.Trigger
          render={<Button type="button" variant="outline" />}
          aria-labelledby="stock-category-label stock-category-summary"
          className="w-full min-w-0 justify-between"
        >
          <span className="truncate" id="stock-category-summary">{summary}</span>
          <ChevronDown aria-hidden="true" className="size-4 shrink-0" />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner sideOffset={6} align="start" className="z-50">
            <Popover.Popup
              initialFocus={searchInput}
              className="grid w-[min(20rem,calc(100vw-2rem))] max-h-[var(--available-height)] gap-2 overflow-auto rounded-lg border bg-popover p-3 text-popover-foreground shadow-lg"
            >
              <Popover.Title className="text-sm font-medium">Filtrar por categorías</Popover.Title>
              <Input ref={searchInput} aria-label="Buscar categorías" value={search}
                onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre" />
              {loading && <p role="status" className="text-sm">Cargando categorías…</p>}
              {error && (
                <div className="space-y-2 text-sm">
                  <p role="alert">No pudimos cargar las categorías.</p>
                  <Button type="button" size="sm" variant="outline" onClick={retry}>Reintentar</Button>
                </div>
              )}
              {!loading && !error && visible.length === 0 && <p className="text-sm">Sin coincidencias.</p>}
              {visible.length > 0 && (
                <div className="max-h-52 overflow-y-auto" role="group" aria-label="Opciones de categorías">
                  {visible.map(({ idProductCategory, name }) => (
                    <label key={idProductCategory} className="flex items-start gap-2 rounded px-1 py-2 text-sm hover:bg-muted">
                      <input
                        className="mt-0.5 size-4 shrink-0 accent-primary"
                        type="checkbox"
                        checked={selected.has(idProductCategory)}
                        onChange={() => toggleCategory(idProductCategory)}
                      />
                      <span className="wrap-anywhere">{name}</span>
                    </label>
                  ))}
                </div>
              )}
              {limitReached && <p role="alert" className="text-sm">Podés seleccionar hasta 30 categorías.</p>}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-2">
                <span className="text-xs text-muted-foreground">{value.length} de 30 seleccionadas</span>
                <Button type="button" size="sm" variant="ghost" disabled={!value.length}
                  onClick={() => { onChange([]); setLimitReached(false); }}>Limpiar categorías</Button>
              </div>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
};
