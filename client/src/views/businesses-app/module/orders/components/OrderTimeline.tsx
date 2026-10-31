import type { OrderEvent } from "../types/orders.types";
import { orderDate, orderStatusLabels } from "../helpers/orders.helpers";

export const OrderTimeline = ({ events }: { events: OrderEvent[] }) => {
  const labels = { CREATED: "Pedido creado", UPDATED: "Pedido editado", STATUS_CHANGED: "Estado actualizado", CANCELLED: "Pedido cancelado" };
  return events.length === 0 ? <p className="text-sm text-muted-foreground">Todavía no hay eventos disponibles.</p> : <ol className="space-y-4 border-l-2 pl-4">{events.map((event) => <li key={event.idOrderEvent} className="space-y-1"><p className="text-sm font-semibold">{labels[event.eventType]}</p><p className="text-xs text-muted-foreground">{orderDate(event.createdAt)} · Usuario #{event.idUser}</p><p className="text-sm">{event.fromStatus ? `${orderStatusLabels[event.fromStatus]} → ` : ""}{orderStatusLabels[event.toStatus]}</p>{event.reason && <p className="break-words text-sm">{event.reason}</p>}</li>)}</ol>;
};
