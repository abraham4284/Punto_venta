import { useEffect, useState } from "react";
import { getOrderProductsRequest } from "../api/orders.api";
import type { OrderDraftLine, OrderProductOption } from "../types/orders.types";

// An absent match is unknown availability, never a reason to drop a snapshot line.
export const useOrderAvailability = (idDeposit: string, lines: OrderDraftLine[]) => {
  const [availability, setAvailability] = useState<{ deposit: string; items: Record<number, OrderProductOption> }>({ deposit: "", items: {} });
  const selection = JSON.stringify(lines.map(({ idProduct, productName, barcode }) => ({ idProduct, productName, barcode })));
  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      if (!idDeposit) return;
      const selected = JSON.parse(selection) as Pick<OrderDraftLine, "idProduct" | "productName" | "barcode">[];
      const results = await Promise.allSettled(selected.map(async (line) => {
        const response = await getOrderProductsRequest(Number(idDeposit), { page: 1, limit: 100, search: (line.barcode || line.productName).slice(0, 160) }, controller.signal);
        return response.data.data.items.find((item) => item.idProduct === line.idProduct);
      }));
      if (!controller.signal.aborted) setAvailability({ deposit: idDeposit, items: Object.fromEntries(results.flatMap((result) => result.status === "fulfilled" && result.value ? [[result.value.idProduct, result.value]] : [])) });
    };
    void load(); return () => controller.abort();
  }, [idDeposit, selection]);
  return availability.deposit === idDeposit ? availability.items : {};
};
