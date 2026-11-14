import type { StockDbRow, StockInventoryItem, StockInventoryRow, StockResponse } from "../types/index.js";

export function mapStock(stock: StockDbRow): StockResponse {
  return {
    idStock: stock.idStock,
    idBusiness: stock.idBusiness,
    businessName: stock.business_name,
    idProduct: stock.idProduct,
    productName: stock.product_name,
    productImageUrl: stock.product_image_url,
    unitType: stock.product_unit_type ?? "UNIT",
    isActive: Boolean(stock.is_active),
    categoryName: stock.category_name,
    idDeposit: stock.idDeposit,
    depositName: stock.deposit_name,
    quantity: Number(stock.quantity),
    updatedAt: stock.updated_at,
    stock_min: Number(stock.stock_min),
  };
}

export function mapStockInventory(row: StockInventoryRow): StockInventoryItem {
  return {
    idStock: row.idStock,
    idProduct: row.idProduct,
    productName: row.productName,
    categoryName: row.categoryName,
    barcode: row.barcode,
    imageUrl: row.imageUrl,
    unitType: row.unitType,
    isActive: Boolean(row.isActive),
    idDeposit: row.idDeposit,
    depositName: row.depositName,
    quantity: Number(row.quantity),
    stockMin: Number(row.stockMin),
    alertStatus: row.alertStatus,
  };
}
