import type { Ref } from "react";
import { createPortal } from "react-dom";
import { PRODUCT_UNIT_TYPE_OPTIONS } from "../../../products/types/products.types";
import { stockAlertLabels } from "../../helpers/stock-inventory.helper";
import type { InventoryPrintReport } from "../../helpers/stock-inventory.helper";
import "./stock-inventory-print.css";

const quantity = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 });
const timestamp = new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" });
const pageStyle = `@page {
  size: A4 portrait;
  margin: 9mm 10mm 11mm;
  @bottom-right {
    content: "Página " counter(page) " de " counter(pages);
    font: 8pt Arial, sans-serif;
  }
}`;

export const StockInventorySheet = ({ report, loadedImages }: {
  report: InventoryPrintReport;
  loadedImages: ReadonlySet<number> | null;
}) => {
  const { filters } = report;
  return (
    <article className="inventory-sheet">
      <header className="inventory-sheet-header">
        <p className="inventory-business">{report.businessName}</p>
        <h1>Planilla de control de inventario</h1>
        <p>{timestamp.format(report.createdAt)} · {quantity.format(report.totalRecords)} registros</p>
        <p><strong>Categorías</strong> {report.categoryNames.join(", ") || "Todas"}</p>
        <p><strong>Depósito</strong> {report.depositName}</p>
        {filters.search && <p><strong>Búsqueda</strong> {filters.search}</p>}
        {filters.alertStatus && <p><strong>Estado</strong> {stockAlertLabels[filters.alertStatus]}</p>}
        {filters.quantity !== null && <p><strong>Cantidad exacta</strong> {quantity.format(filters.quantity)}</p>}
        {(filters.minQuantity !== null || filters.maxQuantity !== null) && (
          <p><strong>Rango de stock</strong> {filters.minQuantity === null ? "Sin mínimo" : quantity.format(filters.minQuantity)}
            {" a "}{filters.maxQuantity === null ? "Sin máximo" : quantity.format(filters.maxQuantity)}</p>
        )}
        <p className="inventory-write-line"><strong>Responsable</strong></p>
      </header>
      <table>
        <colgroup>
          <col style={{ width: "12%" }} /><col style={{ width: "25%" }} /><col style={{ width: "22%" }} />
          <col style={{ width: "13%" }} /><col style={{ width: "14%" }} /><col style={{ width: "14%" }} />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">Foto</th><th scope="col">Producto / código</th><th scope="col">Categoría / depósito</th>
            <th scope="col">Stock sistema</th><th scope="col">Stock físico</th><th scope="col">Diferencia</th>
          </tr>
        </thead>
        <tbody>
          {report.stock.map((row) => (
            <tr key={row.idStock}>
              <td>
                {row.imageUrl && (loadedImages === null || loadedImages.has(row.idStock)) ? (
                  <img src={row.imageUrl} alt="" loading="eager" data-stock-image={row.idStock} />
                ) : <span className="inventory-no-image">Sin imagen</span>}
              </td>
              <td><strong>{row.productName}</strong><br />{row.barcode || "—"}{!row.isActive && <><br />Producto inactivo</>}</td>
              <td>{row.categoryName || "—"}<br /><strong>{row.depositName}</strong>
                {report.inactiveDepositIds.has(row.idDeposit) && <><br />Depósito inactivo</>}</td>
              <td>{quantity.format(row.quantity)}{" "}
                {PRODUCT_UNIT_TYPE_OPTIONS.find(({ value }) => value === row.unitType)?.shortLabel ?? row.unitType}
                {row.alertStatus !== "OK" && <><br />{stockAlertLabels[row.alertStatus]}</>}</td>
              <td /><td />
            </tr>
          ))}
        </tbody>
      </table>
      <footer className="inventory-observations">
        <p className="inventory-write-line"><strong>Observaciones</strong></p>
        <p className="inventory-write-line" />
      </footer>
    </article>
  );
};

export const StockInventoryPrintDocument = ({ report, loadedImages, documentRef }: {
  report: InventoryPrintReport;
  loadedImages: ReadonlySet<number> | null;
  documentRef: Ref<HTMLDivElement>;
}) => createPortal(
  <div ref={documentRef} className="inventory-print-root" data-ready={loadedImages !== null} aria-hidden="true">
    {loadedImages !== null && <style media="print">{pageStyle}</style>}
    <StockInventorySheet report={report} loadedImages={loadedImages} />
  </div>,
  document.body,
);
