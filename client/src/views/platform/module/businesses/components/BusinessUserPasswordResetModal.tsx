import { Copy, KeyRound, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import type {
  PlatformBusinessUser,
  ResetBusinessUserPasswordResponse,
} from "../types";

interface BusinessUserPasswordResetModalProps {
  isOpen: boolean;
  user: PlatformBusinessUser | null;
  result: ResetBusinessUserPasswordResponse | null;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const BusinessUserPasswordResetModal = ({
  isOpen,
  user,
  result,
  loading,
  onClose,
  onConfirm,
}: BusinessUserPasswordResetModalProps) => {
  const handleCopyPassword = async () => {
    if (!result?.temporaryPassword) return;

    await navigator.clipboard.writeText(result.temporaryPassword);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
            {result ? <KeyRound className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
          </div>
          <DialogTitle>
            {result ? "Contrasena temporal generada" : "Restablecer contrasena"}
          </DialogTitle>
          <DialogDescription>
            {result
              ? "Copia esta clave ahora y compartila por un canal seguro. Por seguridad no se volvera a mostrar."
              : "Se generara una contrasena temporal, se revocaran las sesiones activas del usuario en el negocio y se le exigira cambiarla al ingresar."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border bg-slate-50 p-4 text-sm">
            <p className="font-semibold">{user?.name || "Usuario del negocio"}</p>
            <p className="text-muted-foreground">
              {user?.email || user?.username || "-"} · {user?.role || "-"}
            </p>
          </div>

          {result ? (
            <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Contrasena temporal
              </p>
              <div className="flex items-center justify-between gap-3 rounded-lg bg-white p-3 font-mono text-lg font-bold">
                <span className="break-all">{result.temporaryPassword}</span>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  onClick={handleCopyPassword}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-emerald-800">
                Sesiones revocadas: {result.sessionsRevoked}. El usuario debera
                cambiar esta clave en su perfil antes de continuar trabajando.
              </p>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          {result ? (
            <Button type="button" onClick={onClose}>
              Entendido
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={onClose}
              >
                Cancelar
              </Button>
              <Button type="button" disabled={loading} onClick={onConfirm}>
                {loading ? <Spinner className="mr-2 h-4 w-4" /> : null}
                Generar temporal
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
