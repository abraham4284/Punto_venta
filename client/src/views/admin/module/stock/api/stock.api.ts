import axios from "@/api/axios.config";
import type { ApiResponse } from "@/api/axios.response.type";
import type { AxiosResponse } from "axios";
import type { StockResponse } from "../types/stock.types";

export const getStockRequest = (): Promise<
  AxiosResponse<ApiResponse<StockResponse[]>>
> => {
  return axios.get("/stock");
};
