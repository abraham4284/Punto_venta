import { Barcode, ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { labelCurrency } from "@/views/businesses-app/module/products/helpers/product-price-labels.helper";
import type { ProductResponse } from "@/views/businesses-app/module/products/types/products.types";

export const PriceCheckerProductCard = ({ product }: { product: ProductResponse }) => {
  const hasWholesale = product.priceWholesale != null &&
    Number.isFinite(product.priceWholesale) && product.priceWholesale > 0;

  return (
    <article className="grid min-w-0 gap-4 rounded-xl border bg-background p-4 shadow-sm md:grid-cols-[88px_minmax(0,1fr)] md:items-center">
      <div className="h-22 w-22 overflow-hidden rounded-xl bg-muted">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageIcon className="h-7 w-7" />
          </div>
        )}
      </div>
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-lg font-semibold">{product.name}</h3>
          <Badge variant="secondary">{product.productCategoryName || product.categoryName || "Sin categoria"}</Badge>
          <Badge variant={product.isActive ? "default" : "destructive"}>{product.isActive ? "Activo" : "Inactivo"}</Badge>
        </div>
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Barcode className="h-4 w-4" />{product.barcode || "Sin codigo"}
          </span>
          <span>Stock actual: {product.stock}</span>
        </div>
      </div>
      <div className={`grid min-w-0 gap-3 md:col-span-2 ${hasWholesale ? "sm:grid-cols-2" : ""}`}>
        <div className="min-w-0 rounded-xl border border-[#242038] bg-[#FAFAFC] px-3 py-3 text-[#242038]">
          <p className="text-xs font-semibold uppercase tracking-wide">MINORISTA</p>
          <p className="mt-1 text-[clamp(1.125rem,3vw,1.875rem)] font-bold tabular-nums">{labelCurrency(product.priceSale)}</p>
        </div>
        {hasWholesale && (
          <div className="min-w-0 rounded-xl border border-[#6547BE] bg-[#EAE6F7] px-3 py-3 text-[#242038]">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6547BE]">MAYORISTA</p>
            <p className="mt-1 text-[clamp(1.125rem,3vw,1.875rem)] font-bold tabular-nums">{labelCurrency(product.priceWholesale!)}</p>
          </div>
        )}
      </div>
    </article>
  );
};
