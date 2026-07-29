import { useState } from "react";
import { Plus, ShieldAlert } from "lucide-react";
import { Toaster } from "react-hot-toast";
import { Meta } from "@/components/Meta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { PlatformRole } from "@/views/platform/module/auth/types";
import { usePlatformAuthStore } from "@/views/platform/module/auth/store/platformAuth.store";
import {
  emptyPlatformUserFilters,
  usePlatformUsers,
} from "../hooks/usePlatformUsers";
import type { CreatePlatformUserBody, PlatformUserAdmin, PlatformUserFilters } from "../types";

const initialCreateForm: CreatePlatformUserBody = {
  name: "",
  username: "",
  email: "",
  password: "",
  platformRole: "SUPPORT",
};

const formatDate = (value: string | null) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
};

export const PlatformUsersPage = () => {
  const currentRole = usePlatformAuthStore((state) => state.platformUser?.platformRole);
  const {
    users,
    filters,
    page,
    totalPages,
    loading,
    actionLoading,
    error,
    setPage,
    applyFilters,
    createUser,
    changeRole,
    changeStatus,
    revokeSessions,
  } = usePlatformUsers();
  const [localFilters, setLocalFilters] = useState<PlatformUserFilters>(filters);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreatePlatformUserBody>(initialCreateForm);
  const [reasonTarget, setReasonTarget] = useState<{
    user: PlatformUserAdmin;
    action: "status" | "sessions";
  } | null>(null);
  const [reason, setReason] = useState("");

  if (currentRole !== "SUPER_ADMIN") {
    return (
      <>
        <Meta title="Usuarios Platform" />
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            No tienes permisos para administrar usuarios Platform.
          </CardContent>
        </Card>
      </>
    );
  }

  const submitCreate = async () => {
    const success = await createUser(createForm);

    if (success) {
      setCreateOpen(false);
      setCreateForm(initialCreateForm);
    }
  };

  const submitReasonAction = async () => {
    if (!reasonTarget) return;

    const success =
      reasonTarget.action === "status"
        ? await changeStatus(
            reasonTarget.user.idPlatformUser,
            !reasonTarget.user.isActive,
            reason,
          )
        : await revokeSessions(reasonTarget.user.idPlatformUser, reason);

    if (success) {
      setReasonTarget(null);
      setReason("");
    }
  };

  return (
    <>
      <Meta title="Usuarios Platform" />
      <Toaster position="top-right" reverseOrder={false} />
      <div className="grid gap-6">
        <section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge className="mb-3 bg-cyan-50 text-cyan-700 hover:bg-cyan-50">
              SUPER_ADMIN
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight">Usuarios Platform</h1>
            <p className="text-sm text-muted-foreground">
              Administracion de cuentas internas y sesiones de plataforma.
            </p>
          </div>
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Nuevo usuario
          </Button>
        </section>

        <Card>
          <CardContent className="grid gap-3 p-4 md:grid-cols-4">
            <div className="space-y-2 md:col-span-2">
              <Label>Buscar</Label>
              <Input
                value={localFilters.search}
                onChange={(event) =>
                  setLocalFilters({ ...localFilters, search: event.target.value })
                }
                placeholder="Nombre, usuario o email"
              />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select
                value={localFilters.role}
                onValueChange={(value) =>
                  setLocalFilters({
                    ...localFilters,
                    role: (value || "ALL") as PlatformUserFilters["role"],
                  })
                }
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="ALL">Todos</SelectItem>
                    <SelectItem value="SUPER_ADMIN">SUPER_ADMIN</SelectItem>
                    <SelectItem value="SUPPORT">SUPPORT</SelectItem>
                    <SelectItem value="ANALYST">ANALYST</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button type="button" onClick={() => applyFilters(localFilters)}>
                Filtrar
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setLocalFilters(emptyPlatformUserFilters);
                  applyFilters(emptyPlatformUserFilters);
                }}
              >
                Limpiar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="overflow-x-auto p-0">
            {error ? <p className="p-4 text-sm text-red-600">{error}</p> : null}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Sesiones</TableHead>
                  <TableHead>Ultimo acceso</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6}>Cargando usuarios...</TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>No hay usuarios Platform.</TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.idPlatformUser}>
                      <TableCell>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-xs text-muted-foreground">{user.email || user.username}</div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          disabled={actionLoading === `role-${user.idPlatformUser}`}
                          onValueChange={(value) =>
                            void changeRole(user.idPlatformUser, value as PlatformRole)
                          }
                        >
                          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="SUPER_ADMIN">SUPER_ADMIN</SelectItem>
                              <SelectItem value="SUPPORT">SUPPORT</SelectItem>
                              <SelectItem value="ANALYST">ANALYST</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? "default" : "destructive"}>
                          {user.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.activeSessions}</TableCell>
                      <TableCell>{formatDate(user.lastLoginAt)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant={user.isActive ? "destructive" : "outline"}
                            onClick={() => setReasonTarget({ user, action: "status" })}
                          >
                            {user.isActive ? "Desactivar" : "Reactivar"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setReasonTarget({ user, action: "sessions" })}
                          >
                            Revocar sesiones
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Pagina {page} de {totalPages}
          </span>
          <Button type="button" variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            Siguiente
          </Button>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo usuario Platform</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3">
              <Label>Nombre</Label>
              <Input value={createForm.name} onChange={(event) => setCreateForm({ ...createForm, name: event.target.value })} />
              <Label>Usuario</Label>
              <Input value={createForm.username} onChange={(event) => setCreateForm({ ...createForm, username: event.target.value })} />
              <Label>Email</Label>
              <Input value={createForm.email} onChange={(event) => setCreateForm({ ...createForm, email: event.target.value })} />
              <Label>Contrasena temporal</Label>
              <Input type="password" value={createForm.password} onChange={(event) => setCreateForm({ ...createForm, password: event.target.value })} />
              <Label>Rol</Label>
              <Select
                value={createForm.platformRole}
                onValueChange={(value) =>
                  setCreateForm({ ...createForm, platformRole: value as PlatformRole })
                }
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="SUPPORT">SUPPORT</SelectItem>
                    <SelectItem value="ANALYST">ANALYST</SelectItem>
                    <SelectItem value="SUPER_ADMIN">SUPER_ADMIN</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" disabled={actionLoading === "create"} onClick={() => void submitCreate()}>
                Crear
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={Boolean(reasonTarget)} onOpenChange={(open) => !open && setReasonTarget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldAlert className="size-5" />
                Confirmar accion
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Esta accion quedara registrada en la auditoria Platform.
              </p>
              <Label>Motivo</Label>
              <Textarea value={reason} onChange={(event) => setReason(event.target.value)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setReasonTarget(null)}>
                Cancelar
              </Button>
              <Button type="button" disabled={!reason.trim()} onClick={() => void submitReasonAction()}>
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};
