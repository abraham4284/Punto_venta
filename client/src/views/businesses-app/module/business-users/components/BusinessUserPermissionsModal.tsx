import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import type {
  BusinessUser,
  BusinessUserPermissionPayload,
  BusinessUserPermissionsResponse,
  PermissionGroup,
} from "../types";

type BusinessUserPermissionsModalProps = {
  isOpen: boolean;
  user: BusinessUser | null;
  saving: boolean;
  permissionGroups: PermissionGroup[];
  onClose: () => void;
  onLoad: (idUser: number) => Promise<BusinessUserPermissionsResponse>;
  onSave: (
    idUser: number,
    permissions: BusinessUserPermissionPayload[],
  ) => Promise<boolean>;
  onReset: (idUser: number) => Promise<boolean>;
};

const hasCode = (codes: string[], code: string): boolean => {
  return codes.includes(code);
};

export const BusinessUserPermissionsModal = ({
  isOpen,
  user,
  saving,
  permissionGroups,
  onClose,
  onLoad,
  onSave,
  onReset,
}: BusinessUserPermissionsModalProps) => {
  const [loading, setLoading] = useState(false);
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [overrides, setOverrides] = useState<BusinessUserPermissionPayload[]>([]);

  useEffect(() => {
    if (!isOpen || !user) return;

    setLoading(true);
    onLoad(user.idUser)
      .then((data) => {
        setRolePermissions(data.rolePermissions);
        setOverrides(data.overrides);
      })
      .finally(() => setLoading(false));
  }, [isOpen, onLoad, user]);

  const overrideMap = useMemo(() => {
  return new Map(overrides.map((override) => [override.code, override.effect]));
  }, [overrides]);

  const isPermissionEnabled = (permissionCode: string): boolean => {
    const override = overrideMap.get(permissionCode);
    if (override === "ALLOW") return true;
    if (override === "DENY") return false;
    return hasCode(rolePermissions, permissionCode);
  };

  const handleTogglePermission = (
    permissionCode: string,
    enabled: boolean,
  ) => {
    const defaultEnabled = hasCode(rolePermissions, permissionCode);
    const nextOverrides = overrides.filter(
      (override) => override.code !== permissionCode,
    );

    if (enabled !== defaultEnabled) {
      nextOverrides.push({
        code: permissionCode,
        effect: enabled ? "ALLOW" : "DENY",
      });
    }

    setOverrides(nextOverrides);
  };

  const handleSave = async () => {
    if (!user) return;
    const success = await onSave(user.idUser, overrides);
    if (success) onClose();
  };

  const handleReset = async () => {
    if (!user) return;
    const success = await onReset(user.idUser);
    if (success) {
      setOverrides([]);
      onClose();
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Permisos de {user?.name ?? "usuario"}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-4">
            {permissionGroups.map((group) => (
              <Card key={group.module}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    {group.module}
                    <Badge variant="outline">{group.permissions.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {group.permissions.map((permission) => (
                    <div
                      key={permission.code}
                      className="flex items-center justify-between gap-3 rounded-md border p-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{permission.code}</p>
                        <p className="text-xs text-muted-foreground">
                          {permission.description || "Permiso operativo"}
                        </p>
                      </div>
                      <Switch
                        checked={isPermissionEnabled(permission.code)}
                        onCheckedChange={(checked) =>
                          handleTogglePermission(permission.code, checked)
                        }
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" variant="secondary" disabled={saving} onClick={handleReset}>
            Restablecer rol
          </Button>
          <Button type="button" disabled={saving || loading} onClick={handleSave}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Guardar permisos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
