import { useCallback, useEffect, useState } from "react";
import { Plus, Upload } from "lucide-react";

import { Meta } from "@/components/Meta";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUtilsState } from "@/hooks/useUtilsState";

import {
  ProductFilter,
  ImportProductModal,
  ProductMetrics,
  ProductModalForm,
  ProductPagination,
  ProductPricesModal,
  ProductTable,
} from "../components";
import { useProducts } from "../hooks/useProducts";
import type {
  ProductFormValues,
  ProductResponse,
} from "../types/products.types";
import { useProductCategories } from "../../product-categories/hooks/useProductCategories";
import { useDeposits } from "../../deposits/hooks/useDeposits";
import { useBusinessSubscriptionStore } from "../../subscription/store/businessSubscription.store";

export const ProductsPage = () => {
  const [isOpenImportModal, setIsOpenImportModal] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [idProductCategory, setIdProductCategory] = useState<number | null>(
    null,
  );
  const [isActive, setIsActive] = useState<boolean | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const productLimitReached = useBusinessSubscriptionStore(
    (state) => state.subscriptionState?.usage.products.limitReached ?? false,
  );
  const refreshSubscription = useBusinessSubscriptionStore(
    (state) => state.refreshSubscription,
  );
  const {
    products,
    pagination,
    metrics,
    loadingCategories,
    fieldErrors,
    loading: loadingProducts,
    getProducts,
    createProduct,
    updateProduct,
    updateProductPricesAction,
    toggleProductStatus,
    resetProducts,
  } = useProducts();

  const { categories, getProductCategories, loading, resetCategories } =
    useProductCategories();
  const {
    deposits,
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
  const {
    isOpen: isOpenPricesModal,
    dataEdit: priceProduct,
    addDataEdit: addPriceProduct,
    closeModal: closePricesModal,
    setIsOpen: setIsOpenPricesModal,
    resetDataEdit: resetPriceProduct,
  } = useUtilsState<ProductResponse>();

  const fetchProducts = useCallback(
    async (nextPage = page) => {
      await getProducts({
        page: nextPage,
        limit,
        search: debouncedSearch.trim() || null,
        idProductCategory,
        isActive,
      });
    },
    [debouncedSearch, getProducts, idProductCategory, isActive, limit, page],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    return () => {
      resetProducts();
    };
  }, [resetProducts]);

  useEffect(() => {
    void fetchProducts(page);
  }, [fetchProducts, page]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleCategoryChange = (value: number | null) => {
    setIdProductCategory(value);
    setPage(1);
  };

  const handleStatusChange = (value: boolean | null) => {
    setIsActive(value);
    setPage(1);
  };

  const handleLimitChange = (value: number) => {
    setLimit(value);
    setPage(1);
  };

  const handleOpenCreate = () => {
    if (productLimitReached) return;
    resetDataEdit();
    toggleModal();
  };

  const handleOpenPricesModal = (product: ProductResponse) => {
    addPriceProduct(product);
    setIsOpenPricesModal(true);
  };

  const handleClosePricesModal = () => {
    closePricesModal();
    resetPriceProduct();
  };

  useEffect(() => {
    getProductCategories();
    getDeposits();
    return () => {
      resetDeposits();
      resetCategories();
    };
  }, [
    dataEdit,
    getDeposits,
    getProductCategories,
    isOpen,
    resetCategories,
    resetDeposits,
  ]);

  const handleSubmit = async (values: ProductFormValues) => {
    const payload = {
      idProductCategory: Number(values.idProductCategory),
      idDeposit: Number(values.idDeposit),
      initialStock: values.stock === "" ? 0 : Number(values.stock),
      barcode: values.barcode.trim() || null,
      name: values.name.trim(),
      description: values.description.trim() || null,
      imageUrl: values.imageUrl.trim() || null,
      priceCost: Number(values.priceCost),
      priceSale: Number(values.priceSale),
      unitType: values.unitType,
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
      unitType: values.unitType,
      stockMin: values.stockMin === "" ? 0 : Number(values.stockMin),
    };

    if (dataEdit) {
      return updateProduct(dataEdit.idProduct, payloadUpdate);
    }

    return createProduct(payload);
  };

  const handleImported = async () => {
    setPage(1);
    await getProducts({
      page: 1,
      limit,
      search: debouncedSearch.trim() || null,
      idProductCategory,
      isActive,
    });
    await refreshSubscription();
  };
  return (
    <>
      <Meta title="Productos" />
      <main className="space-y-6 p-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Productos</h1>
          <p className="text-muted-foreground">
            Gestioná los productos, precios, stock y categorías de tu negocio.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            disabled={productLimitReached}
            title={
              productLimitReached
                ? "Alcanzaste el limite de productos de tu plan"
                : "Importar productos"
            }
            onClick={() => setIsOpenImportModal(true)}
          >
            <Upload className="mr-2 h-4 w-4" />
            Importar productos
          </Button>
          <Button
            type="button"
            disabled={productLimitReached}
            title={
              productLimitReached
                ? "Alcanzaste el limite de productos de tu plan"
                : "Nuevo producto"
            }
            onClick={handleOpenCreate}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo producto
          </Button>
        </div>
      </section>

      <ProductMetrics metrics={metrics} />

      <Card>
        <CardContent className="space-y-4 p-4">
          <ProductFilter
            value={search}
            idProductCategory={idProductCategory}
            isActive={isActive}
            categories={categories}
            onChange={handleSearchChange}
            onCategoryChange={handleCategoryChange}
            onStatusChange={handleStatusChange}
          />

          <ProductTable
            data={products}
            loading={loadingProducts || loading}
            addDataEdit={addDataEdit}
            toggleModal={toggleModal}
            onOpenPricesModal={handleOpenPricesModal}
            toggleProductStatus={toggleProductStatus}
          />

          <ProductPagination
            pagination={pagination}
            onPageChange={setPage}
            onLimitChange={handleLimitChange}
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
      <ProductPricesModal
        isOpen={isOpenPricesModal}
        product={priceProduct}
        onClose={handleClosePricesModal}
        onSubmit={updateProductPricesAction}
      />
      <ImportProductModal
        isOpen={isOpenImportModal}
        onClose={() => setIsOpenImportModal(false)}
        onImported={handleImported}
      />
      </main>
    </>
  );
};
