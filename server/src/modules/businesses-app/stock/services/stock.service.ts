import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "@/db/db.js";
import { mapStock } from "../helpers/stock.mapper.js";
import type {
  AdvancedStockCountRow,
  AdvancedStockFilters,
  AdvancedStockInventoryRow,
  AdvancedStockResponse,
  CreateInitialStockPayload,
  CriticalStockReportFilters,
  CriticalStockReportResponse,
  CriticalStockReportRow,
  StockBalanceDbRow,
  StockBalanceResponse,
  StockCountRow,
  StockDbRow,
  StockPaginatedResponse,
  StockPaginationFilters,
  StockResponse,
} from "../types/index.js";

interface ExistenceRow extends RowDataPacket {
  total: number;
}

async function createInitialStockZeroService(
  data: CreateInitialStockPayload,
): Promise<StockResponse> {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [existingStockRows] = await connection.query<ExistenceRow[]>(
      `SELECT COUNT(*) AS total
         FROM stock
        WHERE idBusiness = ?
          AND idProduct = ?
          AND idDeposit = ?`,
      [data.idBusiness, data.idProduct, data.idDeposit],
    );

    if (Number(existingStockRows[0]?.total ?? 0) > 0) {
      throw new Error(
        "El producto ya se encuentra registrado en este deposito. Realice un ajuste de stock.",
      );
    }

    const [productRows] = await connection.query<ExistenceRow[]>(
      `SELECT COUNT(*) AS total
         FROM products
        WHERE idBusiness = ?
          AND idProduct = ?
          AND is_active = 1`,
      [data.idBusiness, data.idProduct],
    );

    if (Number(productRows[0]?.total ?? 0) === 0) {
      throw new Error("El producto indicado no existe o no pertenece al negocio");
    }

    const [depositRows] = await connection.query<ExistenceRow[]>(
      `SELECT COUNT(*) AS total
         FROM deposits
        WHERE idBusiness = ?
          AND idDeposit = ?
          AND is_active = 1`,
      [data.idBusiness, data.idDeposit],
    );

    if (Number(depositRows[0]?.total ?? 0) === 0) {
      throw new Error("El deposito indicado no existe o no pertenece al negocio");
    }

    const [insertResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO stock (
        idBusiness,
        idProduct,
        idDeposit,
        quantity,
        updated_at
      )
      VALUES (?, ?, ?, 0, NOW())`,
      [data.idBusiness, data.idProduct, data.idDeposit],
    );

    const [stockRows] = await connection.query<RowDataPacket[]>(
      `SELECT
        s.idStock,
        s.idBusiness,
        b.name AS business_name,
        s.idProduct,
        p.name AS product_name,
        p.image_url AS product_image_url,
        p.unit_type AS product_unit_type,
        pc.name AS category_name,
        s.idDeposit,
        d.name AS deposit_name,
        s.quantity,
        s.updated_at,
        p.stock_min
      FROM stock s
      INNER JOIN businesses b ON b.idBusiness = s.idBusiness
      INNER JOIN products p
        ON p.idProduct = s.idProduct
        AND p.idBusiness = s.idBusiness
      INNER JOIN deposits d
        ON d.idDeposit = s.idDeposit
        AND d.idBusiness = s.idBusiness
      INNER JOIN product_categories pc
        ON p.idProductCategory = pc.idProductCategory
        AND pc.idBusiness = s.idBusiness
      WHERE s.idBusiness = ?
        AND s.idStock = ?
      LIMIT 1`,
      [data.idBusiness, insertResult.insertId],
    );
    const stock = (stockRows as unknown as StockDbRow[])[0];

    if (!stock) {
      throw new Error("No se pudo registrar el stock inicial");
    }

    await connection.commit();

    return mapStock(stock);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function createInitialStockService(
  data: CreateInitialStockPayload,
): Promise<StockResponse> {
  if (data.quantity === 0) {
    return createInitialStockZeroService(data);
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_create_initial_stock(?, ?, ?, ?, ?, ?)",
    [
      data.idBusiness,
      data.idUser,
      data.idProduct,
      data.idDeposit,
      data.quantity,
      data.observation ?? null,
    ],
  );

  const result = rows as unknown as StockDbRow[][];
  const stock = result[0]?.[0];

  if (!stock) {
    throw new Error("No se pudo registrar el stock inicial");
  }

  return mapStock(stock);
}

export async function getStockService(
  idBusiness: number,
  filters: StockPaginationFilters,
): Promise<StockPaginatedResponse> {
  const limit = filters.limit;
  const currentPage = filters.page;
  const offset = (currentPage - 1) * limit;

  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_get_stock(?, ?, ?)",
    [idBusiness, limit, offset],
  );

  const result = rows as unknown as [StockDbRow[], StockCountRow[]];
  const totalRecords = Number(result[1]?.[0]?.totalRecords ?? 0);

  return {
    stock: (result[0] ?? []).map(mapStock),
    pagination: {
      totalRecords,
      currentPage,
      totalPages: Math.max(Math.ceil(totalRecords / limit), 1),
      limit,
    },
  };
}

export async function getStockByIdService(
  idBusiness: number,
  idStock: number,
): Promise<StockResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_get_stock_by_id(?, ?)",
    [idBusiness, idStock],
  );

  const result = rows as unknown as StockDbRow[][];
  const stock = result[0]?.[0];

  if (!stock) {
    throw new Error("Stock no encontrado");
  }

  return mapStock(stock);
}

export async function getStockBalanceService(
  idBusiness: number,
  idProduct: number,
  idDeposit: number,
): Promise<StockBalanceResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_get_stock_by_product_and_deposit(?, ?, ?)",
    [idBusiness, idProduct, idDeposit],
  );

  const result = rows as unknown as StockBalanceDbRow[][];
  const balance = result[0]?.[0];

  if (!balance) {
    return {
      idStock: null,
      idBusiness,
      idProduct,
      idDeposit,
      quantity: 0,
      exists: false,
      updatedAt: null,
    };
  }

  return {
    idStock: balance.idStock,
    idBusiness: balance.idBusiness,
    idProduct: balance.idProduct,
    idDeposit: balance.idDeposit,
    quantity: Number(balance.quantity),
    exists: true,
    updatedAt: balance.updated_at,
  };
}

export async function getCriticalStockReportService(
  filters: CriticalStockReportFilters,
): Promise<CriticalStockReportResponse[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_get_critical_stock_report(?, ?, ?, ?)",
    [
      filters.idBusiness,
      filters.maxQuantity,
      filters.idDeposit ?? null,
      filters.searchProduct ?? null,
    ],
  );

  const result = rows as unknown as CriticalStockReportRow[][];

  return (result[0] ?? []).map(function mapCriticalStock(row) {
    return {
      idStock: row.idStock,
      idBusiness: row.idBusiness,
      idProduct: row.idProduct,
      productName: row.product_name,
      barcode: row.barcode,
      imageUrl: row.image_url,
      idDeposit: row.idDeposit,
      depositName: row.deposit_name,
      quantity: Number(row.quantity),
      stockMin: Number(row.stock_min),
      alertStatus: row.alert_status,
      alertMessage: row.alert_message,
    };
  });
}

export async function getAdvancedStockInventoryService(
  idBusiness: number,
  filters: AdvancedStockFilters,
): Promise<AdvancedStockResponse> {
  const limit = filters.limit;
  const currentPage = filters.page;
  const offset = (currentPage - 1) * limit;

  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_get_advanced_stock_inventory(?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      idBusiness,
      filters.search ?? null,
      filters.idDeposit ?? null,
      filters.quantity ?? null,
      filters.minQuantity ?? null,
      filters.maxQuantity ?? null,
      filters.alertStatus ?? null,
      limit,
      offset,
    ],
  );

  const result = rows as unknown as [
    AdvancedStockInventoryRow[],
    AdvancedStockCountRow[],
  ];
  const totalRecords = Number(result[1]?.[0]?.totalRecords ?? 0);

  return {
    stock: (result[0] ?? []).map(function mapAdvancedStock(row) {
      return {
        idStock: row.idStock,
        idProduct: row.idProduct,
        productName: row.productName,
        categoryName: row.categoryName,
        barcode: row.barcode,
        imageUrl: row.imageUrl,
        unitType: row.unitType,
        priceCost: Number(row.priceCost),
        priceSale: Number(row.priceSale),
        idDeposit: row.idDeposit,
        depositName: row.depositName,
        quantity: Number(row.quantity),
        stockMin: Number(row.stockMin),
        alertStatus: row.alertStatus,
      };
    }),
    pagination: {
      totalRecords,
      currentPage,
      totalPages: Math.max(Math.ceil(totalRecords / limit), 1),
      limit,
    },
  };
}
