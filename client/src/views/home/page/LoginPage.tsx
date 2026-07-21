import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole, Store } from "lucide-react";
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
import { useAuthStore } from "@/views/admin/module/auth";
import { loginSchema, type LoginFormValues } from "../validations/auth.validations";

const initialForm: LoginFormValues = {
  username: "",
  password: "",
};

export const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.loading);
  const navigate = useNavigate();
  const { username, password, onInputChange } = useForm<LoginFormValues>(initialForm);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validation = loginSchema.safeParse({ username, password });

    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message ?? "Revisa los datos");
      return;
    }

    const result = await login(validation.data.username, validation.data.password);

    if (!result.success) {
      toast.error(result.message || "Error al iniciar sesion");
      return;
    }

    toast.success("Bienvenido");
    navigate("/admin/dashboard");
  };

  return (
    <>
      <Meta title="Iniciar sesion" />
      <main className="grid min-h-screen bg-slate-50 lg:grid-cols-[0.92fr_1.08fr]">
        <section className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
          <Card className="w-full max-w-md border-0 bg-white shadow-xl">
            <CardHeader className="space-y-3 text-center">
              <Link to="/" className="mx-auto flex items-center justify-center gap-2">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Store className="h-6 w-6" />
                </span>
              </Link>
              <div>
                <CardTitle className="text-2xl">Iniciar sesion</CardTitle>
                <CardDescription>
                  Accede al panel de administracion de tu comercio.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Usuario</Label>
                  <Input
                    id="username"
                    name="username"
                    placeholder="abraham_admin"
                    value={username}
                    onChange={onInputChange}
                    autoFocus
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••"
                      value={password}
                      onChange={onInputChange}
                      disabled={loading}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2"
                      onClick={() => setShowPassword((value) => !value)}
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </Button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Spinner className="mr-2 h-4 w-4" /> : <LockKeyhole className="mr-2 h-4 w-4" />}
                  Ingresar
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                ¿No tenes una cuenta?{" "}
                <Link to="/register" className="font-medium text-primary hover:underline">
                  Registra tu comercio aqui
                </Link>
              </p>
            </CardContent>
          </Card>
        </section>

        <section
          className="relative hidden overflow-hidden bg-cover bg-center lg:block"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1556745757-8d76bdb6984b?auto=format&fit=crop&w=1400&q=80')",
          }}
        >
          <div className="absolute inset-0 bg-slate-950/70" />
          <div className="relative flex h-full flex-col justify-end p-12 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-300">
              Punto de venta inteligente
            </p>
            <h1 className="mt-4 max-w-xl text-5xl font-bold leading-tight">
              Controla tu negocio con informacion clara en cada decision.
            </h1>
            <p className="mt-5 max-w-lg text-white/75">
              Stock, ventas, compras, clientes y reportes trabajando juntos en
              una experiencia pensada para comercios activos.
            </p>
          </div>
        </section>
      </main>
      <Toaster position="top-right" reverseOrder={false} />
    </>
  );
};
