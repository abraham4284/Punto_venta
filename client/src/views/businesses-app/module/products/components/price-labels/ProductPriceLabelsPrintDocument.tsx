import { createPortal } from "react-dom";
import { labelCurrency, priceLabelPages } from "../../helpers/product-price-labels.helper";
import type { PriceLabelsSnapshot } from "../../helpers/product-price-labels.helper";
import "./product-price-labels-print.css";

const pageStyle = `@page { size: A4 portrait; margin: 8mm; }`;

export const ProductPriceLabelsSheets = ({ snapshot }: { snapshot: PriceLabelsSnapshot }) => (
  <div className="price-label-sheets">
    {priceLabelPages(snapshot.items).map((items, page) => (
      <section className="price-label-page" key={page} aria-label={`Hoja ${page + 1}`}>
        {items.map((item) => {
          const wholesale = snapshot.content.wholesale && item.priceWholesale !== null &&
            Number.isFinite(item.priceWholesale) && item.priceWholesale > 0;
          const price = labelCurrency(item.priceSale);
          const wholesalePrice = wholesale ? labelCurrency(item.priceWholesale!) : "";
          const twoPrices = snapshot.content.retail && wholesale;
          const priceLength = Math.max(snapshot.content.retail ? price.length : 0, wholesalePrice.length, 1);
          const priceFontSize = Math.min(twoPrices ? 18 : 25, (twoPrices ? 130 : 260) / priceLength);
          return (
            <article className="product-price-label" key={item.idProduct}>
              <div className="price-label-brand"><span>{snapshot.businessName}</span>{!item.isActive && <small>INACTIVO</small>}</div>
              <div className="price-label-name">{snapshot.content.name && item.name}</div>
              <div className="price-label-prices" data-columns={twoPrices ? 2 : 1} style={{ fontSize: `${priceFontSize}pt` }}>
                {snapshot.content.retail && (
                  <div className="price-label-price price-label-retail">
                    <small>MINORISTA</small>
                    <strong>{price}</strong>
                  </div>
                )}
                {wholesale && (
                  <div className="price-label-price price-label-wholesale">
                    <small>MAYORISTA</small>
                    <strong>{wholesalePrice}</strong>
                  </div>
                )}
              </div>
              <div className="price-label-metadata">
                {snapshot.content.barcode && item.barcode && <span>{item.barcode}</span>}
                {snapshot.content.category && <span>{item.categoryName}</span>}
              </div>
            </article>
          );
        })}
      </section>
    ))}
  </div>
);

export const ProductPriceLabelsPrintDocument = ({ snapshot }: { snapshot: PriceLabelsSnapshot }) =>
  createPortal(
    <div className="product-price-labels-print-root" aria-hidden="true">
      <style media="print">{pageStyle}</style>
      <ProductPriceLabelsSheets snapshot={snapshot} />
    </div>,
    document.body,
  );
