import axios from "@/api/axios.config";
import type { AxiosResponse } from "axios";
import type {
  ApiResponse,
  BusinessResponse,
  UpdateBusinessBody,
} from "../types";

export const getBusinessRequest = (): Promise<
  AxiosResponse<ApiResponse<BusinessResponse>>
> => {
  return axios.get("/businesses");
};

export const updateBusinessRequest = (
  body: UpdateBusinessBody,
): Promise<AxiosResponse<ApiResponse<BusinessResponse>>> => {
  return axios.patch("/businesses/me", body);
};
