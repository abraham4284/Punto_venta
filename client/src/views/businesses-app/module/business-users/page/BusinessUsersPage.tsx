import { Plus, UsersRound } from "lucide-react";
import { Meta } from "@/components/Meta";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUtilsState } from "@/hooks/useUtilsState";
import { PermissionGate } from "@/views/businesses-app/components/PermissionGate";
import { useCan } from "@/views/businesses-app/hooks/useCan";
import { BusinessUserModal } from "../components/BusinessUserModal";
import { BusinessUserPermissionsModal } from "../components/BusinessUserPermissionsModal";
import { BusinessUsersFilters } from "../components/BusinessUsersFilters";
import { BusinessUsersPagination } from "../components/BusinessUsersPagination";
import { BusinessUsersTable } from "../components/BusinessUsersTable";
import { useBusinessUsers } from "../hooks/useBusinessUsers";
import type { BusinessUser } from "../types";

export const BusinessUsersPage = () => {
  const modalState = useUtilsState<BusinessUser>();
  const permissionsModalState = useUtilsState<BusinessUser>();
  const {
    users,
    filters,
    pagination,
    loading,
    saving,
    statusLoadingId,
    fieldErrors,
    permissionGroups,
    applyFilters,
    changePage,
    createUserAction,
    updateUserAction,
    changeRoleAction,
    changeStatusAction,
    getUserPermissionsAction,
    updateUserPermissionsAction,
    resetUserPermissionsAction,
    setFieldErrors,
  } = useBusinessUsers();
  const canUpdateUsers = useCan("users.update");
  const canChangeRole = useCan("users.change_role");
  const canChangeStatus = useCan("users.change_status");
  const canManagePermissions = useCan("users.manage_permissions");
  const safeUsers = Array.isArray(users) ? users : [];

  const handleOpenCreate = () => {
    modalState.resetDataEdit();
    modalState.setIsOpen(true);
  };
  const handleOpenEdit = (user: BusinessUser) => {
    modalState.addDataEdit(user);
    modalState.setIsOpen(true);
  };

  const handleOpenPermissions = (user: BusinessUser) => {
    permissionsModalState.addDataEdit(user);
    permissionsModalState.setIsOpen(true);
  };

  const activeUsers = safeUsers.filter((user) => user.isActive).length;
  const temporaryPasswordUsers = safeUsers.filter(
    (user) => user.mustChangePassword,
  ).length;

  console.log(safeUsers,'safeUsers')

  return (
    <>
      <Meta title="Usuarios y permisos" />
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Usuarios y permisos
            </h1>
            <p className="text-sm text-muted-foreground">
              Administra accesos operativos sin compartir cuentas.
            </p>
          </div>
          <PermissionGate permission="users.create">
            <Button type="button" onClick={handleOpenCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo usuario
            </Button>
          </PermissionGate>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-lg bg-primary/10 p-3 text-primary">
                <UsersRound className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Usuarios visibles</p>
                <p className="text-2xl font-semibold">{pagination.totalRecords}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Activos en esta pagina</p>
              <p className="text-2xl font-semibold text-emerald-600">{activeUsers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Claves temporales</p>
              <p className="text-2xl font-semibold text-amber-600">
                {temporaryPasswordUsers}
              </p>
            </CardContent>
          </Card>
        </div>

        <BusinessUsersFilters filters={filters} onApply={applyFilters} />

        <BusinessUsersTable
          users={safeUsers}
          loading={loading}
          statusLoadingId={statusLoadingId}
          onEdit={handleOpenEdit}
          onManagePermissions={handleOpenPermissions}
          onChangeRole={changeRoleAction}
          onChangeStatus={changeStatusAction}
          canUpdateUsers={canUpdateUsers}
          canChangeRole={canChangeRole}
          canChangeStatus={canChangeStatus}
          canManagePermissions={canManagePermissions}
        />

        <BusinessUsersPagination pagination={pagination} onChangePage={changePage} />

        <BusinessUserModal
          isOpen={modalState.isOpen}
          dataEdit={modalState.dataEdit}
          saving={saving}
          fieldErrors={fieldErrors}
          onClose={modalState.closeModal}
          onCreate={createUserAction}
          onUpdate={updateUserAction}
          onClearErrors={() => setFieldErrors([])}
        />

        <BusinessUserPermissionsModal
          isOpen={permissionsModalState.isOpen}
          user={permissionsModalState.dataEdit}
          saving={saving}
          permissionGroups={permissionGroups}
          onClose={permissionsModalState.closeModal}
          onLoad={getUserPermissionsAction}
          onSave={updateUserPermissionsAction}
          onReset={resetUserPermissionsAction}
        />
      </div>
    </>
  );
};
