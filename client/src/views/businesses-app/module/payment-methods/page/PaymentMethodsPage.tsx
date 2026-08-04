import { useEffect } from "react";
import { Plus } from "lucide-react";
import { toast } from "react-hot-toast";
import { Meta } from "@/components/Meta";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useUtilsState } from "@/hooks/useUtilsState";
import { PaymentMethodModal } from "../components/PaymentMethodModal";
import { PaymentMethodTable } from "../components/PaymentMethodTable";
import { usePaymentMethods } from "../hooks/usePaymentMethods";
import type {
  PaymentMethodFormValues,
  PaymentMethodResponse,
} from "../types";

export const PaymentMethodsPage = () => {
  const {
    filteredPaymentMethods,
    loading,
    saving,
    error,
    fieldErrors,
    search,
    setSearch,
    getPaymentMethods,
    createPaymentMethod,
    updatePaymentMethod,
    togglePaymentMethodStatus,
    setDefaultPaymentMethod,
  } = usePaymentMethods();
  const {
    isOpen,
    dataEdit,
    toggleModal,
    closeModal,
    addDataEdit,
    resetDataEdit,
  } = useUtilsState<PaymentMethodResponse>();

  useEffect(() => {
    void getPaymentMethods();
  }, [getPaymentMethods]);

  const handleOpenCreate = () => {
    resetDataEdit();
    toggleModal();
  };

  const handleEdit = (paymentMethod: PaymentMethodResponse) => {
    addDataEdit(paymentMethod);
    toggleModal();
  };

  const handleSubmit = async (values: PaymentMethodFormValues) => {
    if (dataEdit) {
      return updatePaymentMethod(dataEdit.idPaymentMethod, {
        name: values.name.trim(),
      });
    }

    return createPaymentMethod({
      code: values.code,
      name: values.name.trim(),
    });
  };

  return (
    <>
      <Meta title="Metodos de pago" />
      <main className="space-y-6 p-6">
        <section className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Metodos de pago
            </h1>
            <p className="text-muted-foreground">
              Configura las cuentas concretas que el negocio usa para cobrar
              ventas y auditar el cierre de caja.
            </p>
          </div>
          <Button type="button" onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo metodo
          </Button>
        </section>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Card>
          <CardContent className="space-y-4 p-4">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre o tipo..."
            />
            <PaymentMethodTable
              data={filteredPaymentMethods}
              loading={loading}
              saving={saving}
              onEdit={handleEdit}
              onToggleStatus={async (paymentMethod) => {
                const result = await togglePaymentMethodStatus(paymentMethod);
                toast[result.status ? "success" : "error"](result.message);
                return result;
              }}
              onSetDefault={async (paymentMethod) => {
                const result = await setDefaultPaymentMethod(paymentMethod);
                toast[result.status ? "success" : "error"](result.message);
                return result;
              }}
            />
          </CardContent>
        </Card>

        <PaymentMethodModal
          isOpen={isOpen}
          dataEdit={dataEdit}
          backendErrors={fieldErrors}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      </main>
    </>
  );
};
