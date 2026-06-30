import axios from "@/api/axios.config";
import type { ApiResponse } from "@/api/axios.response.type";
import type { AxiosResponse } from "axios";
import type {
  ProcessStockAdjustmentPayload,
  ProcessStockTransferPayload,
  StockMovementQueryParams,
  StockMovementsPaginatedResponse,
  StockMovementResponse,
} from "../types/stock.types";

export const getStockMovementsRequest = (
  params: StockMovementQueryParams,
): Promise<
  AxiosResponse<ApiResponse<StockMovementsPaginatedResponse>>
> => {
  return axios.get("/stock-movements", {
    params: {
      page: params.page,
      limit: params.limit,
      movementType:
        params.movementType === "ALL" ? undefined : params.movementType,
      idDeposit: params.idDeposit ?? undefined,
      search: params.search?.trim() || undefined,
    },
  });
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
