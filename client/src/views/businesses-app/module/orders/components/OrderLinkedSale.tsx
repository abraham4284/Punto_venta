import { Link } from "react-router-dom";
import type { Order } from "../types/orders.types";
import { OrderSection } from "./OrderUi";

export const OrderLinkedSale = ({ order, canViewSale }: { order: Order; canViewSale: boolean }) => {
  if (order.status !== "COMPLETED") return null;
  return <OrderSection title="Venta generada">
    {order.linkedSale ? <div className="space-y-2 text-sm"><p className="break-all font-semibold">{order.linkedSale.saleNumber}</p><p>{order.linkedSale.status === "CANCELLED" ? "Venta vinculada anulada" : "Venta completada"}</p>{order.linkedSale.status === "CANCELLED" && <p className="text-muted-foreground">El pedido permanece completado y no admite otra conversión.</p>}{canViewSale && <Link to={`/admin/sales/${order.linkedSale.idSale}`} className="inline-block font-medium text-primary underline">Ver venta</Link>}</div> : <p role="alert" className="text-sm text-destructive">La referencia de venta no está disponible. Actualizá el pedido para revisar su estado.</p>}
  </OrderSection>;
};
