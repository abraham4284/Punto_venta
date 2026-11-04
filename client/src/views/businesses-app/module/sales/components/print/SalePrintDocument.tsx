import { useState } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import type { BusinessResponse } from "../../../businesses/types";
import type { Customer } from "../../../customers/types/customers.types";
import { getCustomerDocumentLabel } from "../../../customers/helpers/customer.helpers";
import type { SaleWithDetailsResponse } from "../../types";
import { formatCurrency } from "@/helpers/formatCurrency";
import { formatDate } from "@/helpers/formatDate";
import { salePrintStyles } from "./sale-print.styles";

type SalePrintDocumentProps = {
  sale: SaleWithDetailsResponse;
  business: BusinessResponse | null;
  customer: Customer | null;
  grossSubtotal: number;
};

const businessTypeLabels: Record<string, string> = {
  MAXIKIOSCO: "Maxikiosco", PRODUCTOS: "Venta de productos", VENTA_PRODUCTOS: "Venta de productos",
  FINANCIERA: "Financiera", KIOSCO: "Kiosco", ALMACEN: "Almacén / Despensa",
  MINIMERCADO: "Minimercado", SUPERMERCADO: "Supermercado", FARMACIA: "Farmacia",
  FERRETERIA: "Ferretería", INDUMENTARIA: "Indumentaria", TECNOLOGIA: "Tecnología",
  DISTRIBUIDORA: "Distribuidora", GASTRONOMIA: "Gastronomía", LIBRERIA: "Librería",
  PERFUMERIA: "Perfumería", VETERINARIA: "Veterinaria", OTRO: "Comercio",
};
const quantityFormatter = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 3 });

const PrintImage = ({ src, label, brand = false }: { src?: string | null; label: string; brand?: boolean }) => {
  const [failed, setFailed] = useState(false);
  return (
    <span className={brand ? "sale-print-logo" : "sale-print-image"}>
      {src && !failed ? (
        <img src={src} alt={label} loading="eager" decoding="sync" onError={() => setFailed(true)} />
      ) : (
        <span className="sale-print-image-fallback" aria-label={brand ? label : "Sin imagen"}>
          {brand ? label.slice(0, 1).toUpperCase() : "—"}
        </span>
      )}
    </span>
  );
};

const PrintField = ({ label, children }: { label: string; children: ReactNode }) => (
  <p className="sale-print-field"><span>{label}:</span> {children}</p>
);

/** Same content for isolated previews and the body-level print document. */
export const SalePrintContent = ({ sale, business, customer, grossSubtotal }: SalePrintDocumentProps) => {
  const businessName = business?.name?.trim() || "Cajora";
  const businessType = business?.businessType ? businessTypeLabels[business.businessType] ?? business.businessType : null;
  const customerName = customer?.fullName || sale.customerName || "Consumidor final";
  const saleNumber = sale.saleNumber || `#${sale.idSale}`;
  const cancelled = sale.status === "CANCELLED";
  const delivery = sale.delivery;

  return (
    <article className="sale-print-document" aria-label={`Comprobante de venta ${saleNumber}`}>
      <style>{salePrintStyles}</style>
      <header className="sale-print-header">
        <div className="sale-print-brand">
          <PrintImage key={business?.logoUrl || "no-logo"} src={business?.logoUrl} label={businessName} brand />
          <div><h1>{businessName}</h1>{businessType && <p>{businessType}</p>}</div>
        </div>
        <div className="sale-print-identification">
          <p className="sale-print-eyebrow">Comprobante de venta</p>
          <p className="sale-print-number">{saleNumber}</p>
          <p className="sale-print-date">{formatDate(sale.saleDate)}</p>
          <span className={`sale-print-status${cancelled ? " sale-print-status-cancelled" : ""}`}>
            {cancelled ? "Cancelada" : "Completada"}
          </span>
        </div>
      </header>

      {cancelled && <p className="sale-print-cancellation">Venta cancelada. Se conservan los importes de la operación original.</p>}

      <section className={`sale-print-parties${delivery ? " sale-print-parties-delivery" : ""}`}>
        <div>
          <h2>Cliente</h2>
          <p className="sale-print-customer-name">{customerName}</p>
          {customer?.documentNumber && <PrintField label="Documento">{getCustomerDocumentLabel(customer)}</PrintField>}
          {customer?.phone?.trim() && <PrintField label="Teléfono">{customer.phone}</PrintField>}
          {customer?.address?.trim() && <PrintField label="Dirección">{customer.address}</PrintField>}
          {customer?.email?.trim() && <PrintField label="Email">{customer.email}</PrintField>}
        </div>
        {delivery && (
          <div className="sale-print-delivery">
            <h2>Entrega a domicilio</h2>
            <PrintField label="Destinatario">{delivery.recipientName}</PrintField>
            {delivery.recipientPhone?.trim() && <PrintField label="Teléfono">{delivery.recipientPhone}</PrintField>}
            <PrintField label="Dirección">{delivery.deliveryAddress}</PrintField>
            {delivery.deliveryReference?.trim() && <PrintField label="Referencia">{delivery.deliveryReference}</PrintField>}
          </div>
        )}
      </section>

      <table className="sale-print-items">
        <caption>Detalle de productos</caption>
        <colgroup><col className="sale-print-photo-col" /><col /><col className="sale-print-quantity-col" /><col className="sale-print-price-col" /><col className="sale-print-total-col" /></colgroup>
        <thead><tr><th scope="col">Foto</th><th scope="col">Producto</th><th scope="col" className="sale-print-numeric">Cant.</th><th scope="col" className="sale-print-numeric">Precio unit.</th><th scope="col" className="sale-print-numeric">Total</th></tr></thead>
        <tbody>
          {sale.items.map((item) => (
            <tr key={item.idSaleDetail}>
              <td><PrintImage key={item.productImageUrl || "no-image"} src={item.productImageUrl} label={item.productName} /></td>
              <td className="sale-print-product">
                <p className="sale-print-product-name">{item.productName}</p>
                {item.barcode?.trim() && <p className="sale-print-product-code">{item.barcode}</p>}
                {item.discount > 0 && <p className="sale-print-line-discount">Descuento de línea: {formatCurrency(item.discount)}</p>}
              </td>
              <td className="sale-print-numeric sale-print-quantity">{quantityFormatter.format(item.quantity)}</td>
              <td className="sale-print-numeric">{formatCurrency(item.unitPrice)}</td>
              <td className="sale-print-numeric sale-print-line-total">{formatCurrency(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="sale-print-summary">
        <dl className="sale-print-totals">
          <div><dt>Subtotal</dt><dd>{formatCurrency(grossSubtotal)}</dd></div>
          <div><dt>Descuento</dt><dd>{formatCurrency(sale.discountTotal)}</dd></div>
          <div className="sale-print-grand-total"><dt>TOTAL</dt><dd>{formatCurrency(sale.total)}</dd></div>
        </dl>
      </section>
      {sale.observation?.trim() && <section className="sale-print-notes"><h2>Observaciones</h2><p>{sale.observation}</p></section>}
      <footer className="sale-print-footer"><p>Gracias por tu compra.</p><p>Comprobante comercial. No válido como factura.</p></footer>
    </article>
  );
};

export const SalePrintDocument = (props: SalePrintDocumentProps) => {
  if (typeof document === "undefined") return null;
  // Outside the application layout: printing cannot inherit clipped containers,
  // subscription banners, administrative headers or navigation.
  return createPortal(<div className="sale-print-root"><SalePrintContent {...props} /></div>, document.body);
};
