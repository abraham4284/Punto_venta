import { useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUtilsState } from "@/hooks/useUtilsState";

import { StockFilter, TableStock,CardStockMetric } from "../components";
import { useStock } from "../hooks/useStock";
import type { StockResponse } from "../types/stock.types";
// import { useProductCategories } from "../hooks/useProductCategories";
// import type {
//   ProductCategoryFormValues,
//   ProductCategoryResponse,
// } from "../types/productCategories.types";

export const StockPage = () => {
  //   const {
  //     filteredCategories,
  //     metrics,
  //     loading,
  //     fieldErrors,
  //     search,
  //     setSearch,
  //     getProductCategories,
  //     createProductCategory,
  //     updateProductCategory,
  //     toggleProductCategoryStatus,
  //   } = useProductCategories();

  const {
    getStock,
    // stock,
    resetStock,
    loading,
    search,
    setSearch,
    filteredStock,
    metrics,
  } = useStock();

  const {
    isOpen,
    dataEdit,
    toggleModal,
    closeModal,
    addDataEdit,
    resetDataEdit,
  } = useUtilsState<StockResponse>();

  useEffect(() => {
    getStock();
    return () => {
      resetStock();
    };
  }, [getStock]);

  const handleOpenCreate = () => {
    resetDataEdit();
    toggleModal();
  };

  //   const handleSubmit = async (values: ProductCategoryFormValues) => {
  //     const payload = {
  //       name: values.name.trim(),
  //       description: values.description.trim() || null,
  //       isDefault: values.isDefault,
  //     };

  //     if (dataEdit) {
  //       return updateProductCategory(dataEdit.idProductCategory, payload);
  //     }

  //     return createProductCategory(payload);
  //   };

  return (
    <main className="space-y-6 p-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Stock de productos
          </h1>
          <p className="text-muted-foreground">
            Gestioná el stock de tus productos.
          </p>
        </div>

        <Button type="button" onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo stock
        </Button>
      </section>

      <CardStockMetric metrics={metrics} />

      <Card>
        <CardContent className="space-y-4 p-4">
          <StockFilter value={search} onChange={setSearch} />

          <TableStock data={filteredStock} loading={loading} />
        </CardContent>
      </Card>

      {/* <CategoryModalForm
        isOpen={isOpen}
        dataEdit={dataEdit}
        backendErrors={fieldErrors}
        onClose={closeModal}
        onSubmit={handleSubmit}
      /> */}
    </main>
  );
};
