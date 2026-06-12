import type { StockDbRow, StockResponse } from "../types/index.js";

export function mapStock(stock: StockDbRow): StockResponse {
  return {
    idStock: stock.idStock,
    idBusiness: stock.idBusiness,
    businessName: stock.business_name,
    idProduct: stock.idProduct,
    productName: stock.product_name,
    productImageUrl: stock.product_image_url,
    idDeposit: stock.idDeposit,
    depositName: stock.deposit_name,
    quantity: Number(stock.quantity),
    updatedAt: stock.updated_at,
    stock_min: Number(stock.stock_min)
  };
}
