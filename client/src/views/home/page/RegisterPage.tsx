import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Building2,
  Eye,
  EyeOff,
  ImageIcon,
  Sparkles,
  Store,
  UserPlus,
} from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useForm } from "@/hooks/useForm";
import { useAuthStore } from "@/views/businesses-app/module/auth";
import {
  registerSchema,
  type RegisterFormValues,
} from "../validations/auth.validations";

const businessTypes = [
  { value: "KIOSCO", label: "Kiosco / Maxikiosco" },
  { value: "ALMACEN", label: "Almacen" },
  { value: "VENTA_PRODUCTOS", label: "Venta de productos" },
  { value: "FINANCIERA", label: "Financiera" },
  { value: "RESTAURANT", label: "Restaurant" },
  { value: "VERDULERIA", label: "Verduleria" },
  { value: "CARNICERIA", label: "Carniceria" },
  { value: "PANADERIA", label: "Panaderia" },
  { value: "FERRETERIA", label: "Ferreteria" },
  { value: "OTRO", label: "Otro comercio" },
];

const initialForm: RegisterFormValues = {
  name: "",
  username: "",
  email: "",
  password: "",
  businessName: "",
  businessSlug: "",
  businessType: "KIOSCO",
  logoUrl: "",
};

const createSlug = (value: string) => {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

export const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [failedLogoUrl, setFailedLogoUrl] = useState<string | null>(null);
  const register = useAuthStore((state) => state.register);
  const loading = useAuthStore((state) => state.loading);
  const navigate = useNavigate();
  const {
    name,
    username,
    email,
    password,
    businessName,
    businessSlug,
    businessType,
    logoUrl,
    onInputChange,
    setFormSate,
    formSate,
  } = useForm<RegisterFormValues>(initialForm);

  useEffect(() => {
    setFormSate((current) => ({
      ...current,
      businessSlug: createSlug(current.businessName),
    }));
  }, [businessName, setFormSate]);

  const handleBusinessTypeChange = (value: string | null) => {
    if (!value) return;
    setFormSate({ ...formSate, businessType: value });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validation = registerSchema.safeParse({
      name,
      username,
      email,
      password,
      businessName,
      businessSlug,
      businessType,
      logoUrl,
    });

    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message ?? "Revisa los datos");
      return;
    }

    const result = await register({
      ...validation.data,
      logoUrl: validation.data.logoUrl ?? null,
    });

    if (!result.success) {
      toast.error(result.message || "No se pudo registrar el comercio");
      return;
    }

    toast.success("Comercio registrado correctamente");
    navigate("/admin/dashboard");
  };

  const selectedBusinessType =
    businessTypes.find((item) => item.value === businessType)?.label ??
    "Selecciona un rubro";
  const shouldShowLogo = Boolean(logoUrl) && failedLogoUrl !== logoUrl;

  return (
    <>
      <Meta title="Registrar comercio" />
      <main className="grid min-h-screen bg-slate-50 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
          <Card className="w-full max-w-2xl border-0 bg-white shadow-xl">
            <CardHeader className="space-y-3">
              <Link to="/" className="flex w-fit items-center gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Store className="h-5 w-5" />
                </span>
                <span className="font-semibold">MaxiKiosco App</span>
              </Link>
              <div>
                <CardTitle className="text-2xl">Registrar mi comercio</CardTitle>
                <CardDescription>
                  Crea tu usuario administrador y configura los datos iniciales
                  del negocio.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <section className="space-y-4">
                  <div>
                    <h3 className="font-semibold">Datos personales y cuenta</h3>
                    <p className="text-sm text-muted-foreground">
                      Estos datos se usan para iniciar sesion y administrar el
                      comercio.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre completo</Label>
                      <Input
                        id="name"
                        name="name"
                        value={name}
                        onChange={onInputChange}
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="username">Usuario</Label>
                      <Input
                        id="username"
                        name="username"
                        value={username}
                        onChange={onInputChange}
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Correo electronico</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={email}
                        onChange={onInputChange}
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
                      <p className="text-xs text-muted-foreground">
                        Minimo 6 caracteres.
                      </p>
                    </div>
                  </div>
                </section>

                <section className="space-y-4 rounded-xl border bg-muted/20 p-4">
                  <div>
                    <h3 className="font-semibold">Datos del comercio</h3>
                    <p className="text-sm text-muted-foreground">
                      El identificador se genera automaticamente desde el nombre
                      del negocio.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="businessName">Nombre del negocio</Label>
                      <Input
                        id="businessName"
                        name="businessName"
                        value={businessName}
                        onChange={onInputChange}
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="businessSlug">Identificador unico</Label>
                      <Input
                        id="businessSlug"
                        name="businessSlug"
                        value={businessSlug}
                        onChange={onInputChange}
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Rubro del negocio</Label>
                      <Select
                        value={businessType}
                        onValueChange={handleBusinessTypeChange}
                      >
                        <SelectTrigger className="w-full">
                          {selectedBusinessType}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {businessTypes.map((item) => (
                              <SelectItem key={item.value} value={item.value}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="logoUrl">URL del logo de la empresa</Label>
                      <Input
                        id="logoUrl"
                        name="logoUrl"
                        value={logoUrl ?? ""}
                        onChange={onInputChange}
                        placeholder="https://ejemplo.com/logo.png"
                        disabled={loading}
                      />
                      <p className="text-xs text-muted-foreground">
                        Opcional. Se usara para identificar visualmente tu
                        comercio dentro del sistema.
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <div className="rounded-xl border bg-background p-4">
                        <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          Previsualizacion del logo
                        </div>
                        <div className="flex min-h-28 items-center justify-center rounded-lg border border-dashed bg-muted/30 p-4">
                          {shouldShowLogo ? (
                            <img
                              src={logoUrl}
                              alt="Logo del comercio"
                              className="max-h-24 max-w-full rounded-lg object-contain"
                              onError={() => setFailedLogoUrl(logoUrl)}
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                              <Building2 className="h-9 w-9" />
                              <span className="text-sm">
                                {logoUrl
                                  ? "No se pudo cargar la imagen"
                                  : "Sin logo cargado"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Spinner className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
                  Registrar comercio
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                ¿Ya tenes una cuenta?{" "}
                <Link to="/login" className="font-medium text-primary hover:underline">
                  Inicia sesion
                </Link>
              </p>
            </CardContent>
          </Card>
        </section>

        <section
          className="relative hidden overflow-hidden bg-cover bg-center lg:block"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1400&q=80')",
          }}
        >
          <div className="absolute inset-0 bg-slate-950/70" />
          <div className="relative flex h-full flex-col justify-end p-12 text-white">
            <Sparkles className="h-10 w-10 text-emerald-300" />
            <h1 className="mt-5 max-w-xl text-5xl font-bold leading-tight">
              Tu comercio listo para vender, medir y crecer.
            </h1>
            <p className="mt-5 max-w-lg text-white/75">
              Configura el negocio una sola vez y comienza a operar con stock,
              ventas, compras y reportes desde el primer dia.
            </p>
          </div>
        </section>
      </main>
      <Toaster position="top-right" reverseOrder={false} />
    </>
  );
};
