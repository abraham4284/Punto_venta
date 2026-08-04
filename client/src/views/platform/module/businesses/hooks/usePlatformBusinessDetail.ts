import { useCallback, useEffect, useState } from "react";
import type { AxiosError } from "axios";
import {
  getPlatformBusinessActivityRequest,
  getPlatformBusinessByIdRequest,
  getPlatformBusinessRecentPurchasesRequest,
  getPlatformBusinessRecentSalesRequest,
  getPlatformBusinessUsageRequest,
  getPlatformBusinessUsersRequest,
  resetBusinessUserPasswordRequest,
} from "../api/platform-businesses.api";
import type {
  PlatformBusinessActivity,
  PlatformBusinessDetail,
  PlatformBusinessPurchase,
  PlatformBusinessSale,
  PlatformBusinessUsage,
  PlatformBusinessUser,
  ResetBusinessUserPasswordResponse,
} from "../types";

const getErrorMessage = (error: unknown, fallback: string) => {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message || axiosError.message || fallback;
};

export const usePlatformBusinessDetail = (idBusiness: number) => {
  const [business, setBusiness] = useState<PlatformBusinessDetail | null>(null);
  const [users, setUsers] = useState<PlatformBusinessUser[]>([]);
  const [activity, setActivity] = useState<PlatformBusinessActivity | null>(null);
  const [usage, setUsage] = useState<PlatformBusinessUsage | null>(null);
  const [sales, setSales] = useState<PlatformBusinessSale[]>([]);
  const [purchases, setPurchases] = useState<PlatformBusinessPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetPasswordLoadingId, setResetPasswordLoadingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [
        businessResponse,
        usersResponse,
        activityResponse,
        usageResponse,
        salesResponse,
        purchasesResponse,
      ] = await Promise.all([
        getPlatformBusinessByIdRequest(idBusiness),
        getPlatformBusinessUsersRequest(idBusiness),
        getPlatformBusinessActivityRequest(idBusiness),
        getPlatformBusinessUsageRequest(idBusiness),
        getPlatformBusinessRecentSalesRequest(idBusiness),
        getPlatformBusinessRecentPurchasesRequest(idBusiness),
      ]);

      setBusiness(businessResponse.data.data);
      setUsers(usersResponse.data.data);
      setActivity(activityResponse.data.data);
      setUsage(usageResponse.data.data);
      setSales(salesResponse.data.data);
      setPurchases(purchasesResponse.data.data);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "No se pudo cargar el negocio"));
    } finally {
      setLoading(false);
    }
  }, [idBusiness]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchDetail();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchDetail]);

  const resetBusinessUserPassword = useCallback(
    async (idUser: number): Promise<{
      success: boolean;
      message: string;
      data: ResetBusinessUserPasswordResponse | null;
    }> => {
      setResetPasswordLoadingId(idUser);
      setError(null);

      try {
        const { data } = await resetBusinessUserPasswordRequest(
          idBusiness,
          idUser,
          { mode: "GENERATE" },
        );

        setUsers((currentUsers) =>
          currentUsers.map((user) =>
            user.idUser === idUser
              ? { ...user, mustChangePassword: true }
              : user,
          ),
        );

        return {
          success: true,
          message: data.message,
          data: data.data,
        };
      } catch (requestError) {
        return {
          success: false,
          message: getErrorMessage(
            requestError,
            "No se pudo restablecer la contrasena",
          ),
          data: null,
        };
      } finally {
        setResetPasswordLoadingId(null);
      }
    },
    [idBusiness],
  );

  return {
    business,
    users,
    activity,
    usage,
    sales,
    purchases,
    loading,
    resetPasswordLoadingId,
    error,
    refresh: fetchDetail,
    resetBusinessUserPassword,
  };
};
