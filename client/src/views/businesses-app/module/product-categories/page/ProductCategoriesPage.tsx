import { useEffect } from "react";
import { Plus } from "lucide-react";

import { Meta } from "@/components/Meta";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUtilsState } from "@/hooks/useUtilsState";

import {
  CategoryFilter,
  CategoryMetrics,
  CategoryModalForm,
  CategoryTable,
} from "../components";
import { useProductCategories } from "../hooks/useProductCategories";
import type {
  ProductCategoryFormValues,
  ProductCategoryResponse,
} from "../types/productCategories.types";

export const ProductCategoriesPage = () => {
  const {
    filteredCategories,
    metrics,
    loading,
    fieldErrors,
    search,
    setSearch,
    getProductCategories,
    createProductCategory,
    updateProductCategory,
    toggleProductCategoryStatus,
  } = useProductCategories();

  const {
    isOpen,
    dataEdit,
    toggleModal,
    closeModal,
    addDataEdit,
    resetDataEdit,
  } = useUtilsState<ProductCategoryResponse>();

  useEffect(() => {
    getProductCategories();
  }, [getProductCategories]);

  const handleOpenCreate = () => {
    resetDataEdit();
    toggleModal();
  };

  const handleSubmit = async (values: ProductCategoryFormValues) => {
    const payload = {
      name: values.name.trim(),
      description: values.description.trim() || null,
      isDefault: values.isDefault,
    };

    if (dataEdit) {
      return updateProductCategory(dataEdit.idProductCategory, payload);
    }

    return createProductCategory(payload);
  };

  return (
    <>
      <Meta title="Categorias" />
      <main className="space-y-6 p-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Categorías de productos
          </h1>
          <p className="text-muted-foreground">
            Gestioná las categorías que se utilizarán para organizar tus
            productos.
          </p>
        </div>

        <Button type="button" onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva categoría
        </Button>
      </section>

      <CategoryMetrics metrics={metrics} />

      <Card>
        <CardContent className="space-y-4 p-4">
          <CategoryFilter value={search} onChange={setSearch} />

          <CategoryTable
            data={filteredCategories}
            loading={loading}
            addDataEdit={addDataEdit}
            toggleModal={toggleModal}
            toggleProductCategoryStatus={toggleProductCategoryStatus}
          />
        </CardContent>
      </Card>

      <CategoryModalForm
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
