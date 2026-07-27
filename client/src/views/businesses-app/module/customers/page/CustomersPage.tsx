import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { Meta } from "@/components/Meta";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import {
  CustomerFormModal,
  CustomerMetrics,
  CustomerSearchInput,
  CustomersTable,
} from "../components";
import { useCustomers } from "../hooks/useCustomers";
import type { Customer, CustomerFormValues } from "../types/customers.types";
import { useUtilsState } from "@/hooks/useUtilsState";

export const CustomersPage = () => {
  const {
    customers,
    loading,
    metrics,
    getCustomers,
    createCustomer,
    updateCustomer,
    toggleCustomerStatus,
  } = useCustomers();

  const {
    isOpen,
    dataEdit,
    toggleModal,
    closeModal,
    addDataEdit,
    resetDataEdit,
  } = useUtilsState<Customer>();

  const [search, setSearch] = useState("");

  useEffect(() => {
    getCustomers();
  }, [getCustomers]);

  const filteredCustomers = useMemo(() => {
    const value = search.toLowerCase().trim();

    if (!value) return customers;

    return customers.filter((customer) => {
      return (
        customer.name.toLowerCase().includes(value) ||
        customer.phone?.toLowerCase().includes(value) ||
        customer.email?.toLowerCase().includes(value) ||
        customer.address?.toLowerCase().includes(value)
      );
    });
  }, [customers, search]);

  const handleOpenCreate = () => {
    resetDataEdit();
    toggleModal();
  };

  const handleOpenEdit = (customer: Customer) => {
    addDataEdit(customer);
    toggleModal();
  };

  const handleSubmit = async (values: CustomerFormValues) => {
    const payload = {
      name: values.name.trim(),
      phone: values.phone.trim() || null,
      email: values.email.trim() || null,
      address: values.address.trim() || null,
      observation: values.observation.trim() || null,
    };

    if (dataEdit) {
      await updateCustomer({
        idCustomer: dataEdit.idCustomer,
        ...payload,
      });
      return;
    }

    await createCustomer(payload);
  };

  const handleToggleStatus = async (customer: Customer) => {
    await toggleCustomerStatus({
      idCustomer: customer.idCustomer,
      isActive: !customer.isActive,
    });
  };

  return (
    <>
      <Meta title="Clientes" />
      <main className="space-y-6 p-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            Gestioná los clientes registrados en tu negocio.
          </p>
        </div>

        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo cliente
        </Button>
      </section>

      <CustomerMetrics metrics={metrics} />

      <Card>
        <CardContent className="space-y-4 p-4">
          <CustomerSearchInput value={search} onChange={setSearch} />

          <CustomersTable
            customers={filteredCustomers}
            loading={loading}
            onEdit={handleOpenEdit}
            onToggleStatus={handleToggleStatus}
          />
        </CardContent>
      </Card>

      <CustomerFormModal
        isOpen={isOpen}
        customerEdit={dataEdit}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
      </main>
    </>
  );
};
