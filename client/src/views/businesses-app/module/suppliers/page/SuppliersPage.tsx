import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useUtilsState } from "@/hooks/useUtilsState";
import { Meta } from "@/components/Meta";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SupplierMetrics, SupplierModal, SupplierTable } from "../components";
import { useSuppliers } from "../hooks/useSuppliers";
import type {
  CreateSupplierBody,
  SupplierFormValues,
  SupplierResponse,
  UpdateSupplierBody,
} from "../types";

const normalizeCreatePayload = (
  values: SupplierFormValues,
): CreateSupplierBody => {
  return {
    name: values.name.trim(),
    phone: values.phone.trim() || null,
    email: values.email.trim() || null,
    address: values.address.trim() || null,
    observation: values.observation.trim() || null,
  };
};

const normalizeUpdatePayload = (
  values: SupplierFormValues,
  isActive: boolean,
): UpdateSupplierBody => {
  return {
    name: values.name.trim(),
    phone: values.phone.trim() || null,
    email: values.email.trim() || null,
    address: values.address.trim() || null,
    observation: values.observation.trim() || null,
    isActive,
  };
};

export const SuppliersPage = () => {
  const [search, setSearch] = useState("");
  const {
    suppliers,
    loading,
    saving,
    error,
    fieldErrors,
    metrics,
    getSuppliers,
    createSupplier,
    updateSupplier,
    toggleSupplierStatus,
  } = useSuppliers();

  const {
    isOpen,
    dataEdit,
    toggleModal,
    closeModal,
    addDataEdit,
    resetDataEdit,
  } = useUtilsState<SupplierResponse>();

  useEffect(() => {
    getSuppliers();
  }, [getSuppliers]);

  const filteredSuppliers = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return suppliers;

    return suppliers.filter((supplier) => {
      return (
        supplier.name.toLowerCase().includes(value) ||
        supplier.phone?.toLowerCase().includes(value) ||
        supplier.email?.toLowerCase().includes(value) ||
        supplier.address?.toLowerCase().includes(value)
      );
    });
  }, [search, suppliers]);

  const handleOpenCreate = () => {
    resetDataEdit();
    toggleModal();
  };

  const handleOpenEdit = (supplier: SupplierResponse) => {
    addDataEdit(supplier);
    toggleModal();
  };

  const handleSubmit = async (
    values: SupplierFormValues,
  ): Promise<boolean> => {
    if (dataEdit) {
      const result = await updateSupplier(
        dataEdit.idSupplier,
        normalizeUpdatePayload(values, dataEdit.isActive),
      );

      return result.status;
    }

    const result = await createSupplier(normalizeCreatePayload(values));
    return result.status;
  };

  const handleToggleStatus = async (supplier: SupplierResponse) => {
    await toggleSupplierStatus(supplier);
  };

  return (
    <>
      <Meta title="Proveedores" />
      <main className="space-y-6 p-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Gestion de Proveedores
          </h1>
          <p className="text-muted-foreground">
            Administra la gestion de tus proveedores
          </p>
        </div>

        <Button type="button" onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Proveedor
        </Button>
      </section>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <SupplierMetrics metrics={metrics} />

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre, telefono, email o direccion..."
              className="pl-9"
            />
          </div>

          <SupplierTable
            suppliers={filteredSuppliers}
            loading={loading}
            onEdit={handleOpenEdit}
            onToggleStatus={handleToggleStatus}
          />
        </CardContent>
      </Card>

      <SupplierModal
        isOpen={isOpen}
        dataEdit={dataEdit}
        saving={saving}
        fieldErrors={fieldErrors}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
      </main>
    </>
  );
};
