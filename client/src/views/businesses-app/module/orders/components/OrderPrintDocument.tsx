import { createPortal } from "react-dom";
import type { Order } from "../types/orders.types";
import { orderDate, orderMoney, orderStatusLabels } from "../helpers/orders.helpers";
import { OrderProductImage } from "./OrderProductImage";

export const OrderPrintDocument = ({ order, depositName }: { order: Order; depositName: string }) => (
  <article className="order-preparation-sheet space-y-5 bg-white text-sm text-slate-950">
    <header className="space-y-2 border-b pb-4">
      <h1 className="text-2xl font-bold">Pedido {order.orderNumber}</h1>
      <p className="font-semibold">Hoja de preparación · {orderStatusLabels[order.status]}</p>
      <p>Creado: {orderDate(order.createdAt)} · {order.fulfillmentType === "DELIVERY" ? "Entrega a domicilio" : "Retiro"}</p>
      <p>Depósito: {depositName}</p>
      <p className="text-xs">Documento operativo. No es una factura ni un comprobante de pago.</p>
      {order.cancellationReason && <p>Cancelado: {order.cancellationReason}</p>}
    </header>
    <section className="space-y-1 break-words">
      <h2 className="font-bold">Cliente</h2>
      <p>{order.customerSnapshot.fullName}</p>
      <p>{order.customerSnapshot.documentNumber ? `${order.customerSnapshot.documentType || "Documento"} ${order.customerSnapshot.documentNumber}` : "Sin documento"}</p>
      <p>Teléfono: {order.customerSnapshot.phone || "Sin teléfono"}</p>
    </section>
    {order.fulfillmentType === "DELIVERY" && order.delivery && <section className="space-y-1 break-words">
      <h2 className="font-bold">Entrega</h2>
      <p>Destinatario: {order.delivery.recipientName}</p>
      <p>Teléfono: {order.delivery.recipientPhone}</p>
      <p>Dirección: {order.delivery.address}</p>
      <p>Referencia: {order.delivery.reference || "Sin referencia"}</p>
    </section>}
    <table className="w-full table-fixed border-collapse text-left">
      <caption className="pb-2 text-left font-bold">Productos para preparar</caption>
      <thead><tr className="border-y"><th className="w-16 py-2">Imagen</th><th className="px-2 py-2">Producto / código</th><th className="w-20 py-2 text-right">Cantidad</th><th className="w-20 py-2 text-center">Listo</th></tr></thead>
      <tbody>{order.items.map((item) => <tr key={item.idOrderDetail} className="border-b align-top">
        <td className="py-3"><OrderProductImage imageUrl={item.productImageUrl} name={item.productName} /></td>
        <td className="break-words px-2 py-3"><p className="font-semibold">{item.productName}</p><p>{item.barcode || "Sin código"}</p>{item.saleMode === "on_order" && <p className="text-xs">Por encargo</p>}</td>
        <td className="py-3 text-right"><strong>{item.quantity}</strong><p className="text-xs">{item.unitType}</p></td>
        <td className="py-3 text-center"><span className="inline-block size-5 border border-slate-700" aria-label="Casilla de preparación" /></td>
      </tr>)}</tbody>
    </table>
    <section className="space-y-2 break-words"><h2 className="font-bold">Observaciones</h2><p className="whitespace-pre-wrap">{order.observation || "Sin observaciones"}</p></section>
    <dl className="ml-auto max-w-xs space-y-2">{[["Subtotal", order.subtotal], ["Descuentos", order.discountTotal], ["Entrega", order.deliveryFee], ["Total del pedido", order.total]].map(([label, value]) => <div className="flex justify-between gap-4" key={String(label)}><dt>{label}</dt><dd className="font-semibold">{orderMoney(Number(value))}</dd></div>)}</dl>
  </article>
);

export const OrderPrintView = (props: { order: Order; depositName: string }) => typeof document === "undefined" ? null : createPortal(
  <div id="order-print-root" aria-hidden="true">
    <style>{`
      #order-print-root { display: none; }
      @media print {
        body:has(#order-print-root) > :not(#order-print-root) { display: none !important; }
        #order-print-root { display: block !important; width: 100%; background: white; }
        #order-print-root .order-preparation-sheet { padding: 12mm; }
        #order-print-root thead { display: table-header-group; }
        #order-print-root tr, #order-print-root section, #order-print-root dl { break-inside: avoid; }
      }
    `}</style>
    <OrderPrintDocument {...props} />
  </div>, document.body,
);
