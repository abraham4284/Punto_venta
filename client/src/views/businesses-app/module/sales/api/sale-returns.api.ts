import axios from "@/api/axios.config";
import type { SaleReturnPayload, SaleReturnResult, SaleReturnsData } from "../types/sale-returns.types";
export const getSaleReturnsRequest = (idSale: number) => axios.get<{ status: boolean; data: SaleReturnsData }>(`/sales/${idSale}/returns`);
export const getSaleReturnRequest = (id: number) => axios.get<{ status: boolean; data: Omit<SaleReturnResult, "idempotentReplay"> }>(`/sale-returns/${id}`);
export const createSaleReturnRequest = (idSale: number, payload: SaleReturnPayload, key: string) => axios.post<{ status: boolean; data: SaleReturnResult }>(`/sales/${idSale}/returns`, payload, { headers: { "Idempotency-Key": key } });
