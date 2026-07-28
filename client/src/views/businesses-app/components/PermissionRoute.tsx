import type { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCanAny } from "@/views/businesses-app/hooks/useCan";

type PermissionRouteProps = {
  permissions: string[];
  children: ReactNode;
};

export const PermissionRoute = ({
  permissions,
  children,
}: PermissionRouteProps) => {
  const canAccess = useCanAny(permissions);

  if (canAccess) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md border-destructive/20">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Acceso restringido</h2>
            <p className="text-sm text-muted-foreground">
              Tu usuario no tiene permisos para ingresar a esta seccion.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={() => window.history.back()}>
            Volver
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
