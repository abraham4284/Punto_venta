import type { AxiosResponse } from "axios";
import { platformApi } from "@/views/platform/module/auth/api/platformAuth.api";
import type { PlatformApiResponse } from "@/views/platform/module/auth/types";
import type { PlatformDashboardResponse } from "../types";

export const getPlatformDashboardRequest = (): Promise<
  AxiosResponse<PlatformApiResponse<PlatformDashboardResponse>>
> => {
  return platformApi.get("/platform/dashboard");
};
