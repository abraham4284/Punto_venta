import type { SaleTicketData, SaleTicketItem } from "../types/index.js";

function escapeHtml(value: string | number | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function renderItemRow(item: SaleTicketItem): string {
  return `
    <tr>
      <td colspan="4" class="product-name">${escapeHtml(item.productName)}</td>
    </tr>
    <tr>
      <td class="qty">${formatMoney(item.quantity)}</td>
      <td class="right">$${formatMoney(item.unitPrice)}</td>
      <td class="right">$${formatMoney(item.discount)}</td>
      <td class="right">$${formatMoney(item.subtotal)}</td>
    </tr>
  `;
}

//  <div class="row"><span>Cliente:</span><span>${escapeHtml(sale.customerName)}</span></div>
//         <div class="row"><span>Vendedor:</span><span>${escapeHtml(sale.userName)}</span></div>
//         <div class="row"><span>Deposito:</span><span>${escapeHtml(sale.depositName)}</span></div>
//         <div class="row"><span>Pago:</span><span>${escapeHtml(sale.paymentMethodName)}</span></div>

export function buildSaleTicketHtml(data: SaleTicketData): string {
  const { sale, items } = data;
  const statusLabel =
    sale.status === "CANCELLED" ? "VENTA ANULADA" : "COMPROBANTE DE VENTA";

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>Ticket venta #${sale.idSale}</title>
    <style>
      @page { size: 80mm auto; margin: 0; }
      * { box-sizing: border-box; }
      html, body {
        width: 80mm;
        margin: 0;
        padding: 0;
        background: #ffffff;
        color: #000000;
        font-family: "Courier New", Courier, monospace;
        font-size: 12px;
        line-height: 1.25;
      }
      body { padding: 4mm; }
      center { display: block; text-align: center; }
      .ticket { width: 72mm; margin: 0 auto; }
      .logo { max-width: 38mm; max-height: 22mm; object-fit: contain; margin-bottom: 4px; }
      .business { font-size: 16px; font-weight: 700; text-transform: uppercase; }
      .muted { font-size: 11px; }
      .status {
        margin-top: 6px;
        padding: 4px 0;
        border-top: 1px dashed #000;
        border-bottom: 1px dashed #000;
        font-weight: 700;
        text-align: center;
      }
      .line { border-top: 1px dashed #000; margin: 8px 0; }
      .row { display: flex; justify-content: space-between; gap: 8px; }
      .row span:first-child { white-space: nowrap; }
      table { width: 100%; border-collapse: collapse; }
      th { border-bottom: 1px dashed #000; font-weight: 700; padding-bottom: 3px; }
      td { padding-top: 3px; vertical-align: top; }
      .product-name { font-weight: 700; word-break: break-word; }
      .qty { width: 19%; }
      .right { text-align: right; }
      .totals .row { margin-top: 3px; }
      .total { font-size: 15px; font-weight: 700; }
      .observation { word-break: break-word; }
      @media print {
        html, body { width: 80mm; }
        body { margin: 0; padding: 4mm; }
        .no-print { display: none; }
      }
    </style>
  </head>
  <body>
    <main class="ticket">
      <center>
        ${
          sale.logoUrl
            ? `<img class="logo" src="${escapeHtml(sale.logoUrl)}" alt="Logo" />`
            : ""
        }
        <div class="business">${escapeHtml(sale.businessName)}</div>
        <div class="muted">${escapeHtml(sale.businessType ?? "Negocio")}</div>
      </center>

      <div class="status">${statusLabel}</div>

      <section>
        <div class="row"><span>Operacion:</span><strong>#${sale.idSale}</strong></div>
        <div class="row"><span>Fecha:</span><span>${formatDate(sale.saleDate)}</span></div>
       
      </section>

      <div class="line"></div>

      <table>
        <thead>
          <tr>
            <th class="qty">Cant.</th>
            <th class="right">P.Unit</th>
            <th class="right">Desc.</th>
            <th class="right">Subt.</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(renderItemRow).join("")}
        </tbody>
      </table>

      <div class="line"></div>

      <section class="totals">
        <div class="row"><span>Subtotal</span><span>$${formatMoney(sale.subtotal)}</span></div>
        <div class="row"><span>Descuento</span><span>$${formatMoney(sale.discountTotal)}</span></div>
        <div class="row total"><span>Total</span><span>$${formatMoney(sale.total)}</span></div>
      </section>

      ${
        sale.observation
          ? `<div class="line"></div><section><strong>Obs.:</strong><div class="observation">${escapeHtml(sale.observation)}</div></section>`
          : ""
      }

      <div class="line"></div>
      <center class="muted">Gracias por su compra</center>
    </main>
  </body>
</html>`;
}
