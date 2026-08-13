import { useEffect, useMemo, useState } from "react";
import { CircleCheck, Search, ShoppingCart } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import { Meta } from "@/components/Meta";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDeposits } from "../../deposits/hooks/useDeposits";
import { useProducts } from "../../products/hooks/useProducts";
import type { ProductResponse } from "../../products/types/products.types";
import { useSuppliers } from "../../suppliers/hooks/useSuppliers";
import { ProductPurchaseCard } from "../components/card/ProductPurchaseCard";
import { AddToPurchaseModal } from "../components/modal/AddToPurchaseModal";
import { PurchaseCartModal } from "../components/modal/PurchaseCartModal";
import { PurchaseCartSheet } from "../components/sheet/PurchaseCartSheet";
import { usePurchases } from "../hooks/usePurchases";
import type { CreatePurchasePayload, PurchaseCartItem } from "../types";

export const CreatePurchasePage = () => {
  const [selectedProduct, setSelectedProduct] =
    useState<ProductResponse | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCartSheetOpen, setIsCartSheetOpen] = useState(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const {
    products,
    loading,
    search,
    setSearch,
    getProducts,
    resetProducts,
  } = useProducts();
  const { deposits, getDeposits, resetDeposits } = useDeposits();
  const { suppliers, getSuppliers, resetSuppliers } = useSuppliers();
  const {
    cart,
    saving,
    fieldErrors,
    addToCart,
    removeFromCart,
    clearCart,
    submitPurchase,
    resetPurchases,
  } = usePurchases();

  const activeProducts = useMemo(() => {
    return products.filter((product) => product.isActive);
  }, [products]);

  useEffect(() => {
    void getDeposits();
    void getSuppliers();

    return () => {
      resetProducts();
      resetDeposits();
      resetSuppliers();
      resetPurchases();
    };
  }, [
    getDeposits,
    getProducts,
    getSuppliers,
    resetDeposits,
    resetProducts,
    resetPurchases,
    resetSuppliers,
  ]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void getProducts({
        page: 1,
        limit: 100,
        search: search.trim() || null,
        isActive: true,
      });
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [getProducts, search]);

  const handleOpenProduct = (product: ProductResponse) => {
    setSelectedProduct(product);
    setIsAddModalOpen(true);
  };

  const handleAddItem = (item: PurchaseCartItem) => {
    addToCart(item);
    toast.success("Producto agregado al carrito de compra");
  };

  const handleSubmit = async (payload: CreatePurchasePayload) => {
    const result = await submitPurchase(payload);

    if (!result.status) {
      toast.error(result.message);
      return false;
    }

    toast.success(result.message);
    clearCart();
    return true;
  };

  const handleContinuePurchase = () => {
    setIsCartSheetOpen(false);
    setIsCartModalOpen(true);
  };

  const handleFinalizePurchase = () => {
    if (cart.length === 0) {
      toast.error("Agrega al menos un producto antes de finalizar la compra.");
      return;
    }

    setIsCartModalOpen(true);
  };

  return (
    <>
      <Meta title="Nueva Compra" />
      <main className="space-y-6 p-3 md:p-6">
        <section className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Nueva compra
            </h1>
            <p className="text-muted-foreground">
              Ingresa mercaderia y actualiza stock en una sola operacion.
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setIsCartSheetOpen(true)}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Ver carrito ({cart.length})
            </Button>
            <Button
              type="button"
              className="w-full sm:w-auto"
              disabled={cart.length === 0}
              onClick={handleFinalizePurchase}
            >
              <CircleCheck className="mr-2 h-4 w-4" />
              Finalizar compra ({cart.length})
            </Button>
          </div>
        </section>

        <Card>
          <CardContent className="grid gap-4 p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar producto por nombre o codigo de barras..."
                className="pl-9"
              />
            </div>

            {loading ? (
              <p className="rounded-lg bg-muted p-8 text-center text-muted-foreground">
                Cargando productos...
              </p>
            ) : activeProducts.length === 0 ? (
              <p className="rounded-lg bg-muted p-8 text-center text-muted-foreground">
                No hay productos disponibles para cargar compras
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {activeProducts.map((product) => (
                  <ProductPurchaseCard
                    key={product.idProduct}
                    product={product}
                    onAdd={handleOpenProduct}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {isAddModalOpen && (
          <AddToPurchaseModal
            isOpen={isAddModalOpen}
            product={selectedProduct}
            deposits={deposits}
            onClose={() => setIsAddModalOpen(false)}
            onConfirm={handleAddItem}
          />
        )}

        <PurchaseCartModal
          isOpen={isCartModalOpen}
          cart={cart}
          suppliers={suppliers}
          saving={saving}
          fieldErrors={fieldErrors}
          onClose={() => setIsCartModalOpen(false)}
          onRemove={removeFromCart}
          onSubmit={handleSubmit}
        />
        <PurchaseCartSheet
          isOpen={isCartSheetOpen}
          cart={cart}
          canContinue={true}
          continueLabel="Finalizar compra"
          onClose={() => setIsCartSheetOpen(false)}
          onContinue={handleContinuePurchase}
          onRemove={removeFromCart}
        />
        <Toaster position="top-right" reverseOrder={false} />
      </main>
    </>
  );
};
