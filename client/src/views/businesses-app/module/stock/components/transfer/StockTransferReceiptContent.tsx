import { useState } from "react";
import { formatDate } from "@/helpers/formatDate";
import { PRODUCT_UNIT_TYPE_OPTIONS } from "../../../products/types/products.types";
import type { StockTransferReceiptData } from "../../helpers/stock-transfer-receipt.helper";

const formatQuantity = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 });

export const StockTransferReceiptContent = ({ receipt }: { receipt: StockTransferReceiptData }) => {
  const [failedLogo, setFailedLogo] = useState<string | null>(null);
  const { logoUrl } = receipt;

  return (
    <article className="stock-transfer-receipt" aria-label={`Comprobante de transferencia #${receipt.referenceId}`}>
      <header className="stock-transfer-receipt-header">
        <div className="stock-transfer-receipt-brand">
          {logoUrl && failedLogo !== logoUrl && (
            <img src={logoUrl} alt="" loading="eager" onError={() => setFailedLogo(logoUrl)} />
          )}
          <p>{receipt.businessName}</p>
        </div>
        <div className="stock-transfer-receipt-identification">
          <p className="stock-transfer-receipt-label">Comprobante de transferencia</p>
          <h2>Transferencia #{receipt.referenceId}</h2>
          <time dateTime={receipt.createdAt}>{formatDate(receipt.createdAt)}</time>
        </div>
      </header>

      <dl className="stock-transfer-receipt-route">
        <div><dt>Origen</dt><dd>{receipt.originName}</dd></div>
        <div><dt>Destino</dt><dd>{receipt.destinationName}</dd></div>
        <div><dt>Registrado por</dt><dd>{receipt.actorName}</dd></div>
      </dl>

      <table>
        <caption>Productos transferidos</caption>
        <thead><tr><th scope="col">Producto</th><th scope="col">Cantidad</th></tr></thead>
        <tbody>
          {receipt.items.map((item) => {
            const unit = PRODUCT_UNIT_TYPE_OPTIONS.find(({ value }) => value === item.unitType)?.shortLabel ?? item.unitType;
            return (
              <tr key={item.idProduct}>
                <td>{item.productName}</td>
                <td>{formatQuantity.format(item.quantity)} {unit}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <footer className="stock-transfer-receipt-end">
        <p className="stock-transfer-receipt-summary">
          {receipt.items.length} {receipt.items.length === 1 ? "producto distinto" : "productos distintos"}
          {" · "}{receipt.movementCount} movimientos registrados
        </p>
        {receipt.observation && (
          <section className="stock-transfer-receipt-notes">
            <h3>Observaciones</h3>
            <p>{receipt.observation}</p>
          </section>
        )}
        <div className="stock-transfer-receipt-signatures">
          <p>Entregado por</p>
          <p>Recibido por</p>
        </div>
        <p className="stock-transfer-receipt-notice">
          Documento operativo de transferencia interna.<br />
          No válido como factura ni comprobante de pago.
        </p>
      </footer>
    </article>
  );
};
