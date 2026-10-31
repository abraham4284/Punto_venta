import { useCallback, useEffect, useState } from "react";
import { getOrderEventsRequest, getOrderRequest, listOrdersRequest } from "../api/orders.api";
import { orderRequestError } from "../helpers/orders.helpers";
import type { Order, OrderEvent, OrderFilters, OrderList, OrderRequestError } from "../types/orders.types";

export const useOrders = (filters: OrderFilters) => {
  const [data, setData] = useState<OrderList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<OrderRequestError | null>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true); setError(null);
      try { const response = await listOrdersRequest(filters, controller.signal); if (!controller.signal.aborted) setData(response.data.data); }
      catch (error) { if (!controller.signal.aborted) setError(orderRequestError(error)); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    };
    void load(); return () => controller.abort();
  }, [filters, revision]);
  return { data, loading, error, reload: () => setRevision((value) => value + 1) };
};

export const useOrderDetails = (id: number, includeEvents = true) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [events, setEvents] = useState<OrderEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<OrderRequestError | null>(null);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision((n) => n + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true); setError(null); setEventsError(null);
      try {
        if (!Number.isInteger(id) || id <= 0) throw new Error("ID invalido");
        const [detail, timeline] = await Promise.allSettled([getOrderRequest(id, controller.signal), ...(includeEvents ? [getOrderEventsRequest(id, controller.signal)] : [])]);
        if (controller.signal.aborted) return;
        if (detail.status === "rejected") throw detail.reason;
        setOrder(detail.value.data.data as Order);
        if (timeline?.status === "fulfilled") setEvents(timeline.value.data.data as OrderEvent[]);
        else if (timeline?.status === "rejected") setEventsError(orderRequestError(timeline.reason).message);
      } catch (error) { if (!controller.signal.aborted) setError(orderRequestError(error)); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    };
    void load(); return () => controller.abort();
  }, [id, includeEvents, revision]);
  return { order, events, loading, error, eventsError, reload, replaceOrder: setOrder };
};
