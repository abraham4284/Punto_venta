import { useEffect, useRef, useState } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { DepositResponse } from "../../../deposits/types/deposits.types";
import { getStockInventoryExportRequest } from "../../api/stock.api";
import { inventoryExportError, isCompleteInventoryExport, prepareInventoryImages } from "../../helpers/stock-inventory.helper";
import type { InventoryPrintReport } from "../../helpers/stock-inventory.helper";
import type { StockCategoryOption, StockInventoryFilters } from "../../types/stock.types";
import { StockInventoryPrintDocument } from "./StockInventoryPrintDocument";

type Props = {
  activeFilters: StockInventoryFilters;
  categoryOptions: StockCategoryOption[];
  deposits: DepositResponse[];
  businessName: string;
};

export const StockInventoryPrintDialog = ({ activeFilters, categoryOptions, deposits, businessName }: Props) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [report, setReport] = useState<InventoryPrintReport | null>(null);
  const [loadedImages, setLoadedImages] = useState<Set<number> | null>(null);
  const request = useRef<AbortController | null>(null);
  const documentRef = useRef<HTMLDivElement>(null);

  const prepare = async () => {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    const filters = { ...activeFilters, categoryIds: [...(activeFilters.categoryIds ?? [])] };
    const categoryNames = filters.categoryIds.map((id) =>
      categoryOptions.find((option) => option.idProductCategory === id)?.name ?? `Categoría #${id}`);
    const deposit = deposits.find(({ idDeposit }) => idDeposit === filters.idDeposit);
    setMessage("");
    setLoading(true);
    try {
      const { data: { data } } = await getStockInventoryExportRequest(filters, controller.signal);
      if (controller.signal.aborted) return;
      if (!isCompleteInventoryExport(data)) {
        setMessage("La respuesta del inventario está incompleta. Volvé a intentar.");
      } else if (data.totalRecords === 0) {
        setMessage("No hay registros para los filtros aplicados.");
      } else {
        const depositName = filters.idDeposit === null
          ? "Todos"
          : deposit?.name ?? data.stock[0].depositName;
        setReport({
          ...data, filters, categoryNames, depositName,
          businessName, createdAt: new Date(),
          inactiveDepositIds: new Set(deposits.filter(({ isActive }) => !isActive).map(({ idDeposit }) => idDeposit)),
        });
      }
    } catch (error) {
      if (!controller.signal.aborted) setMessage(inventoryExportError(error));
    } finally {
      if (!controller.signal.aborted) {
        request.current = null;
        setLoading(false);
      }
    }
  };

  useEffect(() => () => request.current?.abort(), []);

  useEffect(() => {
    if (!report || !documentRef.current) return;
    const controller = new AbortController();
    const images = Array.from(documentRef.current.querySelectorAll<HTMLImageElement>("img[data-stock-image]"));
    void prepareInventoryImages(images, controller.signal).then((ready) => {
      if (!controller.signal.aborted) setLoadedImages(ready);
    });
    return () => controller.abort();
  }, [report]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      void prepare();
      return;
    }
    request.current?.abort();
    request.current = null;
    setLoading(false);
    setMessage("");
    setReport(null);
    setLoadedImages(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button type="button" variant="outline" />}>
        <Printer aria-hidden="true" className="size-4" /> Imprimir inventario
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Planilla de control de inventario</DialogTitle>
          <DialogDescription>La planilla incluye todos los registros que coinciden con los filtros aplicados.</DialogDescription>
        </DialogHeader>
        {loading && <p role="status">Consultando inventario…</p>}
        {message && <p role="status">{message}</p>}
        {report && loadedImages === null && <p role="status">Preparando fotos de {report.totalRecords} registros…</p>}
        {report && loadedImages !== null && <p role="status">{report.totalRecords} registros listos para imprimir.</p>}
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            {loading || (report && loadedImages === null) ? "Cancelar" : "Cerrar"}
          </DialogClose>
          {!loading && message && <Button type="button" onClick={() => void prepare()}>Reintentar</Button>}
          {report && <Button type="button" disabled={loadedImages === null} onClick={() => window.print()}>
            <Printer aria-hidden="true" className="size-4" /> Imprimir / Guardar PDF
          </Button>}
        </DialogFooter>
      </DialogContent>
      {open && report && <StockInventoryPrintDocument report={report} loadedImages={loadedImages} documentRef={documentRef} />}
    </Dialog>
  );
};
