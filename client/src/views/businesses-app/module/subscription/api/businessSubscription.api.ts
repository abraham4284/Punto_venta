import type { AxiosResponse } from "axios";
import axiosInstance from "@/api/axios.config";
import type { BusinessSubscriptionApiResponse } from "../types/businessSubscription.types";

export const getBusinessSubscriptionRequest = (): Promise<
  AxiosResponse<BusinessSubscriptionApiResponse>
> => {
  return axiosInstance.get("/business/subscription");
};
