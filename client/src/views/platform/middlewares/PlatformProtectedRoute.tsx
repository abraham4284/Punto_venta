import { useEffect, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { AppLoadingScreen } from "@/components/loading/AppLoadingScreen";
import { usePlatformAuthStore } from "@/views/platform/module/auth/store/platformAuth.store";

interface PlatformProtectedRouteProps {
  children: ReactNode;
}

export const PlatformProtectedRoute = ({
  children,
}: PlatformProtectedRouteProps) => {
  const platformUser = usePlatformAuthStore((state) => state.platformUser);
  const isAuthenticated = usePlatformAuthStore(
    (state) => state.isAuthenticated,
  );
  const isChecking = usePlatformAuthStore((state) => state.isChecking);
  const checkPlatformSession = usePlatformAuthStore(
    (state) => state.checkPlatformSession,
  );

  useEffect(() => {
    if (!isAuthenticated && !isChecking) {
      void checkPlatformSession();
    }
  }, [checkPlatformSession, isAuthenticated, isChecking]);

  if (isChecking) {
    return (
      <AppLoadingScreen
        message="Verificando plataforma"
        description="Estamos validando tu sesion administrativa."
      />
    );
  }

  if (!isAuthenticated || platformUser?.context !== "PLATFORM") {
    return <Navigate to="/platform/login" replace />;
  }

  return <>{children}</>;
};
