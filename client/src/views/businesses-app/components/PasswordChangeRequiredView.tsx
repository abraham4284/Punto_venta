import { KeyRound } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const PasswordChangeRequiredView = () => {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-lg">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <KeyRound className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Actualiza tu contrasena</h2>
            <p className="text-sm text-muted-foreground">
              Este usuario fue creado con una contrasena temporal. Para seguir
              usando el sistema, primero tenes que definir una nueva contrasena.
            </p>
          </div>
          <Link to="/admin/profile">
            <Button type="button">Ir a mi perfil</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};
