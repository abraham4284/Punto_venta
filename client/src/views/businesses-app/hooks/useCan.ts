import { useMemo } from "react";
import { useAuthStore } from "@/views/businesses-app/module/auth/store/auth.store";

export const useCan = (permissionCode: string): boolean => {
  const user = useAuthStore((state) => state.user);

  return useMemo(() => {
    if (user?.role === "OWNER") return true;
    return user?.permissions?.includes(permissionCode) ?? false;
  }, [permissionCode, user?.permissions, user?.role]);
};

export const useCanAny = (permissionCodes: string[]): boolean => {
  const user = useAuthStore((state) => state.user);

  return useMemo(() => {
    if (user?.role === "OWNER") return true;
    return permissionCodes.some((permissionCode) =>
      user?.permissions?.includes(permissionCode),
    );
  }, [permissionCodes, user?.permissions, user?.role]);
};
