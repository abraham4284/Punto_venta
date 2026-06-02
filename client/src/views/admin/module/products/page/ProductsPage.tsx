import { useEffect } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUtilsState } from "@/hooks/useUtilsState";

import {
  ProductFilter,
  ProductMetrics,
  ProductModalForm,
  ProductTable,
} from "../components";
import { useProducts } from "../hooks/useProducts";
import type {
  ProductFormValues,
  ProductResponse,
} from "../types/products.types";
import { useProductCategories } from "../../product-categories/hooks/useProductCategories";

export const ProductsPage = () => {
  const {
    filteredProducts,
    metrics,
    loadingCategories,
    fieldErrors,
    search,
    setSearch,
    getProducts,
    createProduct,
    updateProduct,
    toggleProductStatus,
  } = useProducts();

  const { categories, getProductCategories, loading } = useProductCategories();

  const {
    isOpen,
    dataEdit,
    toggleModal,
    closeModal,
    addDataEdit,
    resetDataEdit,
  } = useUtilsState<ProductResponse>();

  useEffect(() => {
    getProducts();
    getProductCategories();
  }, [getProducts, getProductCategories]);

  const handleOpenCreate = () => {
    resetDataEdit();
    toggleModal();
  };

  const handleSubmit = async (values: ProductFormValues) => {
    const payload = {
      idProductCategory: Number(values.idProductCategory),
      barcode: values.barcode.trim() || null,
      name: values.name.trim(),
      description: values.description.trim() || null,
      imageUrl: values.imageUrl.trim() || null,
      priceCost: Number(values.priceCost),
      priceSale: Number(values.priceSale),
      stock: values.stock === "" ? 0 : Number(values.stock),
      stockMin: values.stockMin === "" ? 0 : Number(values.stockMin),
    };

    if (dataEdit) {
      return updateProduct(dataEdit.idProduct, payload);
    }

    return createProduct(payload);
  };

  return (
    <main className="space-y-6 p-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Productos</h1>
          <p className="text-muted-foreground">
            Gestioná los productos, precios, stock y categorías de tu negocio.
          </p>
        </div>

        <Button type="button" onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo producto
        </Button>
      </section>

      <ProductMetrics metrics={metrics} />

      <Card>
        <CardContent className="space-y-4 p-4">
          <ProductFilter value={search} onChange={setSearch} />

          <ProductTable
            data={filteredProducts}
            loading={loading}
            addDataEdit={addDataEdit}
            toggleModal={toggleModal}
            toggleProductStatus={toggleProductStatus}
          />
        </CardContent>
      </Card>

      <ProductModalForm
        isOpen={isOpen}
        dataEdit={dataEdit}
        categories={categories}
        loadingCategories={loadingCategories}
        backendErrors={fieldErrors}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </main>
  );
};
