import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/views/admin/module/auth/store/auth.store";

export const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const status = useAuthStore((s) => s.status);

  if (status === "checking") return <div>Loading...</div>;

  if (status !== "authenticated") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
