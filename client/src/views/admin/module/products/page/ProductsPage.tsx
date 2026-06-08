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
import { useDeposits } from "../../deposits/hooks/useDeposits";

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
    resetProducts,
  } = useProducts();

  const { categories, getProductCategories, loading, resetCategories } =
    useProductCategories();
  const {
    deposits,
    loading: loadingDeposits,
    getDeposits,
    resetDeposits,
  } = useDeposits();

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
    return () => {
      resetProducts();
    };
  }, []);

  const handleOpenCreate = () => {
    resetDataEdit();
    toggleModal();
  };

  useEffect(() => {
    getProductCategories();
    getDeposits();
    return () => {
      resetDeposits();
      resetCategories();
    };
  }, [isOpen, dataEdit]);

  const handleSubmit = async (values: ProductFormValues) => {
    const payload = {
      idProductCategory: Number(values.idProductCategory),
      idDeposit: Number(values.idDeposit),
      stock: values.stock === "" ? 0 : Number(values.stock),
      barcode: values.barcode.trim() || null,
      name: values.name.trim(),
      description: values.description.trim() || null,
      imageUrl: values.imageUrl.trim() || null,
      priceCost: Number(values.priceCost),
      priceSale: Number(values.priceSale),
      stockMin: values.stockMin === "" ? 0 : Number(values.stockMin),
    };

    const payloadUpdate = {
      idProductCategory: Number(values.idProductCategory),
      barcode: values.barcode.trim() || null,
      name: values.name.trim(),
      description: values.description.trim() || null,
      imageUrl: values.imageUrl.trim() || null,
      priceCost: Number(values.priceCost),
      priceSale: Number(values.priceSale),
      stockMin: values.stockMin === "" ? 0 : Number(values.stockMin),
    };

    if (dataEdit) {
      return updateProduct(dataEdit.idProduct, payloadUpdate);
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
        deposits={deposits}
        loadingCategories={loadingCategories}
        backendErrors={fieldErrors}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </main>
  );
};
