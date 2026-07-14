import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
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
import { useAuthStore } from "../store/auth.store";

type PasswordFormState = {
  password: string;
  confirmPassword: string;
};

const initialFormState: PasswordFormState = {
  password: "",
  confirmPassword: "",
};

const getRoleLabel = (role: string | undefined): string => {
  const roles: Record<string, string> = {
    OWNER: "Propietario",
    ADMIN: "Administrador",
    SELLER: "Vendedor",
  };

  if (!role) return "Sin rol asignado";

  return roles[role] ?? role;
};

const getInitials = (name: string): string => {
  const parts = name.trim().split(" ").filter(Boolean);

  if (parts.length === 0) return "US";

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

export const ProfilePage = () => {
  const user = useAuthStore((state) => state.user);
  const profileUser = useAuthStore((state) => state.profileUser);
  const profileLoading = useAuthStore((state) => state.profileLoading);
  const passwordLoading = useAuthStore((state) => state.passwordLoading);
  const passwordFieldErrors = useAuthStore((state) => state.passwordFieldErrors);
  const fetchUserProfile = useAuthStore((state) => state.fetchUserProfile);
  const updateUserPassword = useAuthStore((state) => state.updateUserPassword);
  const clearPasswordErrors = useAuthStore((state) => state.clearPasswordErrors);

  const [formState, setFormState] = useState<PasswordFormState>(initialFormState);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const displayName =
    profileUser?.name || profileUser?.username || `Usuario ${user?.idUser ?? ""}`;

  const backendPasswordError = passwordFieldErrors.find(
    (error) => error.field === "password",
  )?.message;

  const passwordLengthError =
    formState.password.length > 0 && formState.password.length < 5
      ? "La contrasena debe tener al menos 5 caracteres"
      : "";

  const confirmPasswordError =
    formState.confirmPassword.length > 0 &&
    formState.password !== formState.confirmPassword
      ? "Las contrasenas ingresadas no coinciden"
      : "";

  const passwordError =
    backendPasswordError || (submitted ? passwordLengthError : "");

  const canSubmit = useMemo(() => {
    return (
      formState.password.length >= 5 &&
      formState.confirmPassword.length >= 5 &&
      formState.password === formState.confirmPassword &&
      !passwordLoading
    );
  }, [formState.confirmPassword, formState.password, passwordLoading]);

  const handleChange = (field: keyof PasswordFormState, value: string) => {
    clearPasswordErrors();
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);

    if (!user?.idUser) {
      toast.error("No se pudo identificar el usuario autenticado");
      return;
    }

    if (formState.password.length < 5) {
      toast.error("La contrasena debe tener al menos 5 caracteres");
      return;
    }

    if (formState.password !== formState.confirmPassword) {
      toast.error("Las contrasenas ingresadas no coinciden");
      return;
    }

    const result = await updateUserPassword(user.idUser, formState.password);

    if (!result.success) {
      toast.error(result.message || "No se pudo actualizar la contrasena");
      return;
    }

    toast.success(result.message);
    setFormState(initialFormState);
    setSubmitted(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  useEffect(() => {
    if (!user?.idUser || profileUser || profileLoading) return;

    void fetchUserProfile(user.idUser);
  }, [fetchUserProfile, profileLoading, profileUser, user?.idUser]);

  return (
    <main className="min-h-screen space-y-6 bg-slate-50 p-3 md:p-6">
      <section className="flex flex-col justify-between gap-4 rounded-2xl border bg-white p-5 shadow-sm md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-xl font-black text-primary-foreground shadow-sm">
            {getInitials(displayName)}
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Perfil y seguridad
            </p>
            <h1 className="text-2xl font-bold tracking-tight">{displayName}</h1>
            <p className="text-sm text-muted-foreground">
              Administra tus datos de sesion y la contrasena de acceso.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full border bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
          <ShieldCheck className="h-4 w-4" />
          Sesion activa
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Informacion de perfil</CardTitle>
                <CardDescription>
                  Datos asociados al usuario autenticado.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {profileLoading && !profileUser ? (
              <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
                <Spinner />
                Cargando informacion del usuario...
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Nombre
                  </p>
                  <p className="mt-2 text-base font-semibold">
                    {profileUser?.name || "Sin nombre registrado"}
                  </p>
                </div>
                <div className="rounded-xl border bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Usuario
                  </p>
                  <p className="mt-2 text-base font-semibold">
                    {profileUser?.username || "-"}
                  </p>
                </div>
                <div className="rounded-xl border bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Correo
                  </p>
                  <p className="mt-2 text-base font-semibold">
                    {profileUser?.email || "Sin correo registrado"}
                  </p>
                </div>
                <div className="rounded-xl border bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Rol
                  </p>
                  <p className="mt-2 text-base font-semibold">
                    {getRoleLabel(profileUser?.role || user?.role)}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-700">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Cambio de contrasena</CardTitle>
                <CardDescription>
                  Actualiza tu clave de acceso de forma segura.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="password">Nueva contrasena</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formState.password}
                    disabled={passwordLoading}
                    aria-invalid={Boolean(passwordError)}
                    placeholder="Minimo 5 caracteres"
                    className="pr-10"
                    onChange={(event) =>
                      handleChange("password", event.target.value)
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2"
                    disabled={passwordLoading}
                    onClick={() => setShowPassword((current) => !current)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {passwordError && (
                  <p className="text-sm text-destructive">{passwordError}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar contrasena</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formState.confirmPassword}
                    disabled={passwordLoading}
                    aria-invalid={Boolean(confirmPasswordError)}
                    placeholder="Repeti la nueva contrasena"
                    className="pr-10"
                    onChange={(event) =>
                      handleChange("confirmPassword", event.target.value)
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2"
                    disabled={passwordLoading}
                    onClick={() =>
                      setShowConfirmPassword((current) => !current)
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {confirmPasswordError && (
                  <p className="text-sm text-destructive">
                    {confirmPasswordError}
                  </p>
                )}
              </div>

              <div className="border-t pt-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!canSubmit}
                >
                  {passwordLoading && <Spinner className="mr-2 h-4 w-4" />}
                  Guardar nueva contrasena
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>

      <Toaster position="top-right" reverseOrder={false} />
    </main>
  );
};
