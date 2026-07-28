import type { ReactNode } from "react";
import { useCan } from "@/views/businesses-app/hooks/useCan";

type PermissionGateProps = {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
};

export const PermissionGate = ({
  permission,
  children,
  fallback = null,
}: PermissionGateProps) => {
  const canAccess = useCan(permission);

  return canAccess ? <>{children}</> : <>{fallback}</>;
};
