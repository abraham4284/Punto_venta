import { Edit, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { BusinessUser } from "../types";

type BusinessUsersTableProps = {
  users: BusinessUser[];
  loading: boolean;
  statusLoadingId: number | null;
  onEdit: (user: BusinessUser) => void;
  onManagePermissions: (user: BusinessUser) => void;
  onChangeRole: (idUser: number, role: "ADMIN" | "SELLER" | "DELIVERY") => void;
  onChangeStatus: (idUser: number, isActive: boolean) => void;
  canUpdateUsers: boolean;
  canChangeRole: boolean;
  canChangeStatus: boolean;
  canManagePermissions: boolean;
};

const roleLabels: Record<string, string> = {
  OWNER: "Propietario",
  ADMIN: "Administrador",
  SELLER: "Vendedor",
  DELIVERY: "Cadete / Delivery",
};

export const BusinessUsersTable = ({
  users,
  loading,
  statusLoadingId,
  onEdit,
  onManagePermissions,
  onChangeRole,
  onChangeStatus,
  canUpdateUsers,
  canChangeRole,
  canChangeStatus,
  canManagePermissions,
}: BusinessUsersTableProps) => {
  const safeUsers = Array.isArray(users) ? users : [];

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="w-full overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Clave</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-28 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : safeUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-28 text-center text-muted-foreground">
                  No hay usuarios para mostrar
                </TableCell>
              </TableRow>
            ) : (
              safeUsers.map((user) => (
                <TableRow key={user.idUser}>
                  <TableCell>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-xs text-muted-foreground">
                      @{user.username}
                    </div>
                  </TableCell>
                  <TableCell>{user.email || "-"}</TableCell>
                  <TableCell>
                    {user.role === "OWNER" ? (
                      <Badge variant="outline">{roleLabels[user.role]}</Badge>
                    ) : canChangeRole ? (
                      <Select
                        value={user.role}
                        onValueChange={(value) => {
                          if (value === "ADMIN" || value === "SELLER" || value === "DELIVERY") {
                            onChangeRole(user.idUser, value);
                          }
                        }}
                      >
                        <SelectTrigger className="w-[150px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADMIN">Administrador</SelectItem>
                          <SelectItem value="SELLER">Vendedor</SelectItem>
                          <SelectItem value="DELIVERY">Cadete / Delivery</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline">{roleLabels[user.role]}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.mustChangePassword ? (
                      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                        Temporal
                      </Badge>
                    ) : (
                      <Badge variant="outline">Actualizada</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {statusLoadingId === user.idUser ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : null}
                      <Switch
                        checked={user.isActive}
                        disabled={
                          !canChangeStatus ||
                          user.role === "OWNER" ||
                          statusLoadingId === user.idUser
                        }
                        onCheckedChange={(checked) =>
                          onChangeStatus(user.idUser, checked)
                        }
                      />
                      <span className="text-xs text-muted-foreground">
                        {user.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={!canUpdateUsers}
                        onClick={() => onEdit(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={user.role === "OWNER" || !canManagePermissions}
                        onClick={() => onManagePermissions(user)}
                      >
                        {user.role === "OWNER" ? (
                          <KeyRound className="h-4 w-4" />
                        ) : (
                          <ShieldCheck className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
