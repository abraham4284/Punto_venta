import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { isAxiosError } from "axios";
import { ArrowRightLeft, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { DepositResponse } from "../../../deposits/types/deposits.types";
import { PRODUCT_UNIT_TYPE_OPTIONS } from "../../../products/types/products.types";
import { getAdvancedStockInventoryRequest } from "../../api/stock.api";
import { processStockTransfersRequest } from "../../api/stock.movement.api";
import {
  addTransferLine, buildStockTransferPayload, getStockTransferFailure,
  getTransferQuantityError, MAX_TRANSFER_ITEMS, refreshTransferLines,
} from "../../helpers/stock-transfer.helper";
import type { StockTransferLine } from "../../helpers/stock-transfer.helper";
import type { AdvancedStockInventoryItem, ApiErrorResponse, StockTransferBatchResponse } from "../../types/stock.types";
import { StockTransferProductPicker } from "./StockTransferProductPicker";

interface Props {
  deposits: DepositResponse[];
  onSuccess: (transfer: StockTransferBatchResponse) => void | Promise<void>;
}

const formatQuantity = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 });

export const BatchStockTransferDialog = ({ deposits, onSuccess }: Props) => {
  const [open, setOpen] = useState(false);
  const [origin, setOrigin] = useState(0);
  const [destination, setDestination] = useState(0);
  const [lines, setLines] = useState<StockTransferLine[]>([]);
  const [observation, setObservation] = useState("");
  const [failure, setFailure] = useState<ReturnType<typeof getStockTransferFailure> | null>(null);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState("");
  const [pickerVersion, setPickerVersion] = useState(0);
  const [operation, setOperation] = useState<"submit" | "refresh" | null>(null);
  const busy = useRef(false);
  const activeDeposits = deposits.filter((deposit) => deposit.isActive);
  const from = activeDeposits.find((deposit) => deposit.idDeposit === origin);
  const to = activeDeposits.find((deposit) => deposit.idDeposit === destination);
  const payload = from && to ? buildStockTransferPayload(origin, destination, observation, lines) : null;
  const addedIds = new Set(lines.map(({ product }) => product.idProduct));
  const disabled = operation !== null;

  const reset = () => {
    setOrigin(0);
    setDestination(0);
    setLines([]);
    setObservation("");
    setFailure(null);
    setNeedsRefresh(false);
    setRefreshMessage("");
  };

  const changeOpen = (next: boolean) => {
    if (busy.current) return;
    if (next) reset();
    setOpen(next);
  };

  const changeOrigin = (value: string | null) => {
    if (lines.length || busy.current) return;
    const next = Number(value);
    setOrigin(next);
    if (next === destination) setDestination(0);
    setFailure(null);
    setRefreshMessage("");
  };

  const updateLines = (next: StockTransferLine[]) => {
    setLines(next);
    setFailure(null);
    setRefreshMessage("");
    if (next.length === 0) {
      setNeedsRefresh(false);
      setPickerVersion((version) => version + 1);
    }
  };

  const refresh = async () => {
    if (busy.current || !from || !lines.length) return;
    busy.current = true;
    setOperation("refresh");
    setRefreshMessage("");
    try {
      const current = new Map<number, AdvancedStockInventoryItem>();
      let page = 1;
      let totalPages: number;
      do {
        const { data } = await getAdvancedStockInventoryRequest({
          idDeposit: origin, search: "", page, limit: 100,
          minQuantity: null, maxQuantity: null, quantity: null, alertStatus: null,
        });
        for (const product of data.data.stock) {
          if (product.idDeposit === origin && addedIds.has(product.idProduct)) current.set(product.idProduct, product);
        }
        totalPages = data.data.pagination.totalPages;
        page += 1;
      } while (current.size < addedIds.size && page <= totalPages);
      setLines(refreshTransferLines(lines, current));
      setPickerVersion((version) => version + 1);
      setNeedsRefresh(false);
      setFailure(null);
      setRefreshMessage("Saldos actualizados. Revisá las cantidades antes de confirmar.");
    } catch {
      setNeedsRefresh(true);
      setRefreshMessage("No se pudieron actualizar los saldos. Volvé a intentarlo antes de confirmar.");
    } finally {
      busy.current = false;
      setOperation(null);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy.current || needsRefresh || !payload) return;
    busy.current = true;
    setOperation("submit");
    setFailure(null);
    setRefreshMessage("");
    let transfer: StockTransferBatchResponse;
    try {
      const { data } = await processStockTransfersRequest(payload);
      if (data.status !== true || !data.data?.referenceId) throw new Error("Respuesta de transferencia incompleta");
      transfer = data.data;
    } catch (error) {
      const response = isAxiosError<ApiErrorResponse & { code?: string }>(error) ? error.response : undefined;
      const next = getStockTransferFailure(response?.status, response?.data);
      setFailure(next);
      setNeedsRefresh(next.requiresRefresh);
      return;
    } finally {
      busy.current = false;
      setOperation(null);
    }
    reset();
    setOpen(false);
    try {
      await onSuccess(transfer);
    } catch {
      toast.error("La transferencia se realizó, pero no se pudo actualizar el inventario.");
    }
  };

  const fieldError = (field: string) => failure?.errors.find((error) => error.field === field)?.message;

  return (
    <Dialog open={open} disablePointerDismissal onOpenChange={(next, details) => {
      if (busy.current) details.cancel();
      else changeOpen(next);
    }}>
      <DialogTrigger render={<Button variant="outline" type="button" />}>
        <ArrowRightLeft aria-hidden="true" className="size-4" /> Transferir stock
      </DialogTrigger>
      <DialogContent showCloseButton={false} className="flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] flex-col sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Transferir stock</DialogTitle>
          <DialogDescription>Mové varios productos entre dos depósitos en una sola operación.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="flex min-h-0 flex-col gap-4" aria-busy={disabled}>
          <div className="min-h-0 space-y-5 overflow-y-auto p-1">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="transfer-origin">Depósito origen</Label>
                <Select value={from ? String(origin) : null} onValueChange={changeOrigin} disabled={disabled || lines.length > 0}>
                  <SelectTrigger id="transfer-origin" className="w-full" aria-describedby="transfer-origin-hint">
                    <SelectValue placeholder="Elegí el origen">{from?.name}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {activeDeposits.map((deposit) => <SelectItem key={deposit.idDeposit} value={String(deposit.idDeposit)}>{deposit.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p id="transfer-origin-hint" className="text-xs text-muted-foreground">
                  {fieldError("idDepositFrom") || (lines.length > 0 ? "Vaciá la transferencia para cambiar el origen." : "")}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="transfer-destination">Depósito destino</Label>
                <Select
                  value={to ? String(destination) : null}
                  onValueChange={(value) => { setDestination(Number(value)); setFailure(null); }}
                  disabled={!from || disabled}
                >
                  <SelectTrigger id="transfer-destination" className="w-full" aria-invalid={Boolean(fieldError("idDepositTo"))} aria-describedby={fieldError("idDepositTo") ? "transfer-destination-error" : undefined}>
                    <SelectValue placeholder="Elegí el destino">{to?.name}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {activeDeposits.filter((deposit) => deposit.idDeposit !== origin).map((deposit) =>
                      <SelectItem key={deposit.idDeposit} value={String(deposit.idDeposit)}>{deposit.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {fieldError("idDepositTo") && <p id="transfer-destination-error" className="text-xs text-destructive">{fieldError("idDepositTo")}</p>}
              </div>
            </div>
            {activeDeposits.length < 2 && <p role="status" className="text-muted-foreground">Necesitás dos depósitos activos para transferir.</p>}

            {open && <StockTransferProductPicker
              key={`${origin}:${pickerVersion}`}
              origin={from ? origin : 0}
              addedIds={addedIds}
              atLimit={lines.length >= MAX_TRANSFER_ITEMS}
              disabled={disabled}
              onAdd={(product) => { if (!busy.current) updateLines(addTransferLine(lines, product, origin)); }}
            />}

            <section className="space-y-2" aria-labelledby="transfer-lines-title">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 id="transfer-lines-title" className="font-semibold">Productos a transferir ({lines.length})</h3>
                {lines.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" disabled={!from || disabled} onClick={() => void refresh()}>
                      <RefreshCw aria-hidden="true" className="size-4" /> {operation === "refresh" ? "Actualizando…" : "Actualizar saldos"}
                    </Button>
                    <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => updateLines([])}>
                      Vaciar transferencia
                    </Button>
                  </div>
                )}
              </div>
              {lines.length >= MAX_TRANSFER_ITEMS && <p role="status">Alcanzaste el máximo de 100 productos por transferencia.</p>}
              {lines.length === 0 && <p className="rounded-lg border border-dashed p-3 text-muted-foreground">Agregá productos desde la búsqueda.</p>}
              {lines.length > 0 && <ul className="divide-y rounded-lg border">
                {lines.map((line, index) => {
                  const { product, quantity } = line;
                  const unit = PRODUCT_UNIT_TYPE_OPTIONS.find(({ value }) => value === product.unitType);
                  const inputId = `transfer-quantity-${product.idProduct}`;
                  const quantityError = getTransferQuantityError(line) || fieldError(`items.${index}.quantity`) || fieldError(`items.${index}.idProduct`);
                  return (
                    <li key={product.idProduct} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 p-3 sm:grid-cols-[minmax(0,1fr)_8rem_auto] sm:items-start">
                      <div className="col-span-2 flex min-w-0 items-start gap-2 sm:col-span-1">
                        {product.imageUrl && <img src={product.imageUrl} alt="" className="size-9 shrink-0 rounded-md border object-cover" />}
                        <div className="min-w-0">
                          <p className="break-words font-medium">{product.productName}</p>
                          <p className="text-xs text-muted-foreground">{unit?.label} · {formatQuantity.format(product.quantity)} {unit?.shortLabel} disponibles</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={inputId}>Cantidad <span className="sr-only">de {product.productName}</span></Label>
                        <Input
                          id={inputId} type="number" min={product.unitType === "UNIT" ? 1 : 0.01}
                          step={product.unitType === "UNIT" ? 1 : 0.01} max={product.quantity}
                          value={quantity} disabled={disabled} aria-invalid={Boolean(quantityError)}
                          aria-describedby={quantityError ? `${inputId}-error` : undefined}
                          onChange={(event) => updateLines(lines.map((item, position) => position === index ? { ...item, quantity: event.target.value } : item))}
                        />
                        {quantityError && <p id={`${inputId}-error`} className="text-xs text-destructive">{quantityError}</p>}
                      </div>
                      <Button
                        type="button" variant="ghost" size="icon-sm" className="mt-4 justify-self-end"
                        aria-label={`Eliminar ${product.productName}`} disabled={disabled}
                        onClick={() => updateLines(lines.filter((_, position) => position !== index))}
                      >
                        <Trash2 aria-hidden="true" className="size-4" />
                      </Button>
                    </li>
                  );
                })}
              </ul>}
            </section>
            <div className="space-y-2">
              <Label htmlFor="transfer-observation">Observación (opcional)</Label>
              <Textarea id="transfer-observation" maxLength={255} rows={2} value={observation} disabled={disabled}
                aria-invalid={Boolean(fieldError("observation"))} aria-describedby={fieldError("observation") ? "transfer-observation-error" : undefined}
                onChange={(event) => { setObservation(event.target.value); setFailure(null); }} />
              {fieldError("observation") && <p id="transfer-observation-error" className="text-xs text-destructive">{fieldError("observation")}</p>}
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 space-y-1">
              <p className="break-words font-medium">{from?.name || "Origen"} → {to?.name || "Destino"}</p>
              <p className="text-xs text-muted-foreground">{lines.length} {lines.length === 1 ? "producto" : "productos"}</p>
              {failure && <p role="alert" className="text-sm text-destructive">{failure.message}</p>}
              {refreshMessage && <p role="status" className="text-sm">{refreshMessage}</p>}
              {needsRefresh && !failure && !refreshMessage && <p role="status">Actualizá los saldos antes de confirmar.</p>}
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <DialogClose render={<Button type="button" variant="outline" disabled={disabled} />}>Cancelar</DialogClose>
              <Button type="submit" disabled={!payload || needsRefresh || disabled}>
                {operation === "submit" ? "Transfiriendo…" : "Confirmar transferencia"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
