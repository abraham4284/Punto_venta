import type {
  ProductWithStockDbRow,
  ProductWithStockResponse,
  ProductUnitType,
  SaleDbRow,
  SaleDetailDbRow,
  SaleDetailResponse,
  SaleResponse,
} from "../types/index.js";

function normalizeUnitType(value: ProductUnitType | null): ProductUnitType {
  return value ?? "UNIT";
}

export function mapSale(sale: SaleDbRow): SaleResponse {
  return {
    idSale: sale.idSale,
    saleNumber: sale.sale_number ?? `#${sale.idSale}`,
    idBusiness: sale.idBusiness,
    idUser: sale.idUser,
    userName: sale.user_name,
    idCustomer: sale.idCustomer,
    customerName: sale.customer_name,
    idDeposit: sale.idDeposit,
    depositName: sale.deposit_name,
    idPaymentMethod: sale.idPaymentMethod,
    paymentMethodName: sale.payment_method_name,
    saleDate: sale.sale_date,
    subtotal: Number(sale.subtotal),
    discountTotal: Number(sale.discount_total),
    total: Number(sale.total),
    paymentDetail: sale.payment_detail,
    status: sale.status,
    observation: sale.observation,
    createdAt: sale.created_at,
    updatedAt: sale.updated_at,
  };
}

export function mapSaleDetail(detail: SaleDetailDbRow): SaleDetailResponse {
  return {
    idSaleDetail: detail.idSaleDetail,
    idSale: detail.idSale,
    idBusiness: detail.idBusiness,
    idProduct: detail.idProduct,
    productName: detail.product_name,
    barcode: detail.barcode,
    productImageUrl: detail.product_image_url,
    idDeposit: detail.idDeposit,
    depositName: detail.deposit_name,
    quantity: Number(detail.quantity),
    unitPrice: Number(detail.unit_price),
    discount: Number(detail.discount),
    total: Number(detail.total),
    createdAt: detail.created_at,
  };
}

export function mapProductWithStock(
  product: ProductWithStockDbRow,
): ProductWithStockResponse {
  return {
    idProduct: product.idProduct,
    idBusiness: product.idBusiness,
    idProductCategory: product.idProductCategory,
    categoryName: product.category_name,
    barcode: product.barcode,
    name: product.name,
    description: product.description,
    imageUrl: product.image_url,
    priceCost: Number(product.price_cost),
    priceSale: Number(product.price_sale),
    priceWholesale:
      product.price_wholesale === null ? null : Number(product.price_wholesale),
    unitType: normalizeUnitType(product.unit_type),
    stockMin: Number(product.stock_min),
    isActive: Boolean(product.is_active),
    stockQuantity: Number(product.stock_quantity),
  };
}
