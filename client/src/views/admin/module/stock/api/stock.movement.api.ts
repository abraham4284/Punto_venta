import axios from "@/api/axios.config";
import type { ApiResponse } from "@/api/axios.response.type";
import type { AxiosResponse } from "axios";
import type {
  ProcessStockAdjustmentPayload,
  ProcessStockTransferPayload,
  StockMovementResponse,
} from "../types/stock.types";

export const getStockMovementsRequest = (): Promise<
  AxiosResponse<ApiResponse<StockMovementResponse[]>>
> => {
  return axios.get("/stock-movements");
};

export const processStockAdjustmentRequest = (
  payload: ProcessStockAdjustmentPayload,
): Promise<AxiosResponse<ApiResponse<StockMovementResponse[]>>> => {
  return axios.post("/stock-movements/adjust", payload);
};

export const processStockTransferRequest = (
  payload: ProcessStockTransferPayload,
): Promise<AxiosResponse<ApiResponse<StockMovementResponse[]>>> => {
  return axios.post("/stock-movements/transfer", payload);
};
