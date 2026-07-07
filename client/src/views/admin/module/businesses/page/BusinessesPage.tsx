import { useEffect } from "react";
import { Building2, Settings, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useUtilsState } from "@/hooks/useUtilsState";
import { BusinessProfileCard } from "../components/card/BusinessProfileCard";
import { UpdateBusinessModal } from "../components/modal/UpdateBusinessModal";
import { useBusinesses } from "../hooks/useBusinesses";
import type { BusinessResponse } from "../types";

export const BusinessesPage = () => {
  const {
    business,
    loading,
    saving,
    error,
    fieldErrors,
    user,
    getBusiness,
    updateBusiness,
    resetBusiness,
  } = useBusinesses();
  const {
    dataEdit,
    isOpenModalEdit,
    addDataEdit,
    openModalEdit,
    closeModalEdit,
    resetDataEdit,
  } = useUtilsState<BusinessResponse>();

  useEffect(() => {
    getBusiness();

    return () => {
      resetBusiness();
    };
  }, [getBusiness, resetBusiness]);

  const handleOpenEdit = () => {
    if (!business) return;

    addDataEdit(business);
    openModalEdit();
  };

  const handleCloseEdit = () => {
    closeModalEdit();
    resetDataEdit();
  };

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </main>
    );
  }

  return (
    <main className="space-y-6 bg-white p-2 md:p-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Configuracion del Negocio
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Mi Empresa</h1>
          <p className="text-muted-foreground">
            Administra la identidad corporativa asociada a tu sesion actual.
          </p>
        </div>

        <Button type="button" onClick={handleOpenEdit} disabled={!business}>
          <Settings className="mr-2 h-4 w-4" />
          Editar configuracion
        </Button>
      </section>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <section className="grid gap-6 xl:grid-cols-[280px_1fr]">
        <aside className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4" />
                Perfil
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Informacion visible del negocio, slug y tipo operativo.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4" />
                Tenant
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Usuario autenticado: #{user?.idUser ?? "-"}</p>
              <p>Negocio del token: #{user?.idBusiness ?? "-"}</p>
            </CardContent>
          </Card>
        </aside>

        <section className="space-y-4">
          {business ? (
            <BusinessProfileCard business={business} onEdit={handleOpenEdit} />
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No se pudo cargar la informacion del negocio.
              </CardContent>
            </Card>
          )}
        </section>
      </section>

      <UpdateBusinessModal
        isOpen={isOpenModalEdit}
        dataEdit={dataEdit}
        backendErrors={fieldErrors}
        saving={saving}
        onClose={handleCloseEdit}
        onSubmit={updateBusiness}
      />
    </main>
  );
};
