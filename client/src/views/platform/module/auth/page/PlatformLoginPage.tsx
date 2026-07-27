import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import { Meta } from "@/components/Meta";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useForm } from "@/hooks/useForm";
import { usePlatformAuthStore } from "@/views/platform/module/auth/store/platformAuth.store";
import {
  platformLoginSchema,
  type PlatformLoginFormValues,
} from "@/views/platform/module/auth/validations/platformAuth.validation";

const initialForm: PlatformLoginFormValues = {
  username: "",
  password: "",
};

export const PlatformLoginPage = () => {
  const navigate = useNavigate();
  const [fieldError, setFieldError] = useState<string | null>(null);
  const { username, password, onInputChange } =
    useForm<PlatformLoginFormValues>(initialForm);
  const loginPlatformAction = usePlatformAuthStore(
    (state) => state.loginPlatformAction,
  );
  const isLoading = usePlatformAuthStore((state) => state.isLoading);
  const isAuthenticated = usePlatformAuthStore(
    (state) => state.isAuthenticated,
  );

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/platform/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldError(null);

    const validation = platformLoginSchema.safeParse({ username, password });

    if (!validation.success) {
      const message =
        validation.error.issues[0]?.message || "Revisa las credenciales";
      setFieldError(message);
      toast.error(message);
      return;
    }

    const result = await loginPlatformAction(validation.data);

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    navigate("/platform/dashboard", { replace: true });
  };

  return (
    <>
      <Meta title="Plataforma" />
      <Toaster position="top-right" />
      <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_#0f766e_0,_#020617_42%,_#020617_100%)] px-4 py-10">
        <Card className="w-full max-w-md border-white/10 bg-white/95 shadow-2xl shadow-cyan-950/40">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-slate-950 text-cyan-300 shadow-lg">
              <ShieldCheck className="size-7" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">
                Acceso Plataforma
              </CardTitle>
              <CardDescription>
                Panel interno para administradores del sistema SaaS.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-2">
                <Label htmlFor="username">Usuario</Label>
                <Input
                  id="username"
                  name="username"
                  value={username}
                  onChange={onInputChange}
                  placeholder="super_admin"
                  autoComplete="username"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Contrasena</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={onInputChange}
                  placeholder="Ingrese su clave"
                  autoComplete="current-password"
                />
              </div>

              {fieldError && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {fieldError}
                </p>
              )}

              <Button type="submit" className="h-10" disabled={isLoading}>
                {isLoading ? (
                  <Spinner />
                ) : (
                  <>
                    <LockKeyhole className="size-4" />
                    Ingresar al panel
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </>
  );
};
