import { useEffect } from "react";
import { useAuthStore } from "@/views/businesses-app/module/auth/store/auth.store";
import { useBusinessSubscriptionStore } from "@/views/businesses-app/module/subscription/store/businessSubscription.store";

export const AuthInitializer = ({ children }: { children: React.ReactNode }) => {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const fetchSubscription = useBusinessSubscriptionStore(
    (state) => state.fetchSubscription,
  );
  const clearSubscription = useBusinessSubscriptionStore(
    (state) => state.clearSubscription,
  );

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (status === "authenticated" && user?.idBusiness) {
      void fetchSubscription();
      return;
    }

    if (status === "unauthenticated") {
      clearSubscription();
    }
  }, [clearSubscription, fetchSubscription, status, user?.idBusiness]);

  if (status === "checking") {
    return <div>Cargando sesión...</div>;
  }

  return <>{children}</>;
};
