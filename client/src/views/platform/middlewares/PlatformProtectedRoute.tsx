import { useEffect, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Spinner } from "@/components/ui/spinner";
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
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 shadow-2xl">
          <Spinner />
          <span className="text-sm text-slate-200">
            Verificando sesion de plataforma...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || platformUser?.context !== "PLATFORM") {
    return <Navigate to="/platform/login" replace />;
  }

  return <>{children}</>;
};
