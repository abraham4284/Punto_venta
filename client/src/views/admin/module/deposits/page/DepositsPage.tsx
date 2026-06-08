import { useEffect } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUtilsState } from "@/hooks/useUtilsState";

import {
  DepositFilter,
  DepositMetrics,
  DepositModalForm,
  DepositTable,
} from "../components";
import { useDeposits } from "../hooks/useDeposits";
import type {
  DepositFormValues,
  DepositResponse,
} from "../types/deposits.types";

export const DepositsPage = () => {
  const {
    filteredDeposits,
    metrics,
    loading,
    fieldErrors,
    search,
    setSearch,
    getDeposits,
    createDeposit,
    updateDeposit,
    toggleDepositStatus,
    toggleDepositDefault,
  } = useDeposits();

  const {
    isOpen,
    dataEdit,
    toggleModal,
    closeModal,
    addDataEdit,
    resetDataEdit,
  } = useUtilsState<DepositResponse>();

  useEffect(() => {
    getDeposits();
  }, [getDeposits]);

  const handleOpenCreate = () => {
    resetDataEdit();
    toggleModal();
  };

  const handleSubmit = async (values: DepositFormValues) => {
    const payload = {
      name: values.name.trim(),
      description: values.description.trim() || null,
      isDefault: values.isDefault,
    };

    if (dataEdit) {
      return updateDeposit(dataEdit.idDeposit, payload);
    }

    return createDeposit(payload);
  };

  return (
    <main className="space-y-6 p-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Depósitos</h1>
          <p className="text-muted-foreground">
            Gestioná los depósitos disponibles para organizar el stock del
            negocio.
          </p>
        </div>

        <Button type="button" onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo depósito
        </Button>
      </section>

      <DepositMetrics metrics={metrics} />

      <Card>
        <CardContent className="space-y-4 p-4">
          <DepositFilter value={search} onChange={setSearch} />

          <DepositTable
            data={filteredDeposits}
            loading={loading}
            addDataEdit={addDataEdit}
            toggleModal={toggleModal}
            toggleDepositStatus={toggleDepositStatus}
            toggleDepositDefault={toggleDepositDefault}
          />
        </CardContent>
      </Card>

      <DepositModalForm
        isOpen={isOpen}
        dataEdit={dataEdit}
        backendErrors={fieldErrors}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </main>
  );
};
