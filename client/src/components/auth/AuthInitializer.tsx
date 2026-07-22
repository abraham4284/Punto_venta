import { useEffect } from "react";
import { useAuthStore } from "@/views/businesses-app/module/auth/store/auth.store";

export const AuthInitializer = ({ children }: { children: React.ReactNode }) => {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (status === "checking") {
    return <div>Cargando sesión...</div>;
  }

  return <>{children}</>;
};
