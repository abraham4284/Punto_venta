import axios from "@/api/axios.config";
import type { ApiResponse } from "@/api/axios.response.type";
import type { AxiosResponse } from "axios";
import type { DashboardData } from "../types";

export const getDashboardMetrics = (
  year?: number,
): Promise<
  AxiosResponse<ApiResponse<DashboardData>>
> => {
  return axios.get("/dashboard/metrics", {
    params: { year },
  });
};
