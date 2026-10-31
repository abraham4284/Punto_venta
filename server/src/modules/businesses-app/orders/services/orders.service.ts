import { randomUUID } from "node:crypto";
import type { Pool, PoolConnection, RowDataPacket } from "mysql2/promise";
import { pool } from "@/db/db.js";
import { orderBodySchema, orderCancelSchema, orderKeySchema, orderStatusSchema } from "../validations/orders.validations.js";
import { assertOrderCancellable, assertOrderEditable, assertOrderQuantity, assertOrderTransition, OrderError } from "../helpers/orders.helper.js";
import { mapOrder, mapOrderDetail, mapOrderEvent, mapOrderProduct } from "../helpers/orders.mapper.js";
import type { CustomerSnapshotRow, OrderActor, OrderBody, OrderDbRow, OrderDetailDbRow, OrderEventDbRow, OrderFilters, OrderProductDbRow, OrderProductsQuery } from "../types/index.js";

type Database = Pool | PoolConnection;
interface IdRow extends RowDataPacket { idOrder: number }
interface SummaryRow extends RowDataPacket { totalRecords: number; totalAmount: string | number; pending: number; confirmed: number; preparing: number; ready: number; completed: number; cancelled: number }

async function call<T extends RowDataPacket>(db: Database, sql: string, params: unknown[] = []): Promise<T[][]> {
  const [rows] = await db.query<RowDataPacket[]>(sql, params);
  return rows as unknown as T[][];
}

async function findReplay(idBusiness: number, key: string) {
  const [rows] = await pool.query<IdRow[]>(
    "SELECT idOrder FROM orders WHERE idBusiness = ? AND idempotency_key = ? LIMIT 1", [idBusiness, key],
  );
  return rows[0] ? getOrderService(idBusiness, Number(rows[0].idOrder)) : null;
}

export async function getOrderService(idBusiness: number, idOrder: number) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    // The header lock prevents a concurrent edit from mixing old header/new lines.
    await lockOrder(connection, idBusiness, idOrder);
    const result = await call<OrderDbRow | OrderDetailDbRow>(connection, "CALL sp_order_get(?, ?)", [idBusiness, idOrder]);
    const header = result[0]?.[0] as OrderDbRow | undefined;
    if (!header) throw new OrderError(404, "ORDER_NOT_FOUND", "Pedido no encontrado");
    const order = { ...mapOrder(header), items: ((result[1] ?? []) as OrderDetailDbRow[]).map(mapOrderDetail) };
    await connection.commit();
    return order;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
}

async function lockOrder(connection: PoolConnection, idBusiness: number, idOrder: number): Promise<OrderDbRow> {
  const result = await call<OrderDbRow>(connection, "CALL sp_order_lock(?, ?)", [idBusiness, idOrder]);
  const row = result[0]?.[0];
  if (!row) throw new OrderError(404, "ORDER_NOT_FOUND", "Pedido no encontrado");
  return row;
}

async function assertActor(connection: PoolConnection, actor: OrderActor): Promise<void> {
  const [users] = await connection.query<RowDataPacket[]>(
    "SELECT bu.idUser FROM business_users bu JOIN users u ON u.idUser = bu.idUser WHERE bu.idBusiness = ? AND bu.idUser = ? AND bu.is_active = 1 AND u.is_active = 1 FOR UPDATE",
    [actor.idBusiness, actor.idUser],
  );
  if (!users.length) throw new OrderError(403, "ORDER_ACTOR_INVALID", "Usuario no habilitado en el negocio");
}

async function loadSnapshots(connection: PoolConnection, actor: OrderActor, data: OrderBody) {
  await assertActor(connection, actor);
  const [customers] = await connection.query<CustomerSnapshotRow[]>(
    "SELECT first_name, last_name, document_type, document_number, phone, email, address FROM customers WHERE idBusiness = ? AND idCustomer = ? AND is_active = 1 FOR UPDATE",
    [actor.idBusiness, data.idCustomer],
  );
  const customer = customers[0];
  if (!customer) throw new OrderError(400, "ORDER_CUSTOMER_INVALID", "Cliente no disponible en el negocio");
  const [deposits] = await connection.query<RowDataPacket[]>(
    "SELECT idDeposit FROM deposits WHERE idBusiness = ? AND idDeposit = ? AND is_active = 1 FOR UPDATE", [actor.idBusiness, data.idDeposit],
  );
  if (!deposits.length) throw new OrderError(400, "ORDER_DEPOSIT_INVALID", "Deposito no disponible en el negocio");
  if (data.expectedPaymentMethodId != null) {
    const [methods] = await connection.query<RowDataPacket[]>(
      "SELECT idPaymentMethod FROM payment_methods WHERE idBusiness = ? AND idPaymentMethod = ? AND is_active = 1 FOR UPDATE",
      [actor.idBusiness, data.expectedPaymentMethodId],
    );
    if (!methods.length) throw new OrderError(400, "ORDER_PAYMENT_METHOD_INVALID", "Metodo de pago no disponible en el negocio");
  }
  const products: OrderProductDbRow[] = [];
  const sorted = [...data.items].sort(function sortProducts(a, b) { return a.idProduct - b.idProduct; });
  for (const item of sorted) {
    const [rows] = await connection.query<OrderProductDbRow[]>(
      "SELECT idProduct, name, barcode, unit_type, sale_mode, price_sale FROM products WHERE idBusiness = ? AND idProduct = ? AND is_active = 1 FOR UPDATE",
      [actor.idBusiness, item.idProduct],
    );
    if (!rows[0]) throw new OrderError(400, "ORDER_PRODUCT_INVALID", "Producto no disponible en el negocio");
    assertOrderQuantity(rows[0].unit_type, item.quantity);
    products.push(rows[0]);
  }
  return {
    customer: { fullName: `${customer.first_name} ${customer.last_name}`.trim(), documentType: customer.document_type,
      documentNumber: customer.document_number, phone: customer.phone, email: customer.email, address: customer.address },
    products,
  };
}

export async function saveOrderService(actor: OrderActor, input: OrderBody, key?: string, idOrder?: number) {
  const data = orderBodySchema.parse(input);
  if (idOrder == null) {
    key = orderKeySchema.parse(key);
    const replay = await findReplay(actor.idBusiness, key);
    if (replay) return { order: replay, idempotentReplay: true };
  }
  const connection = await pool.getConnection();
  let savedId = idOrder;
  let duplicate: unknown;
  try {
    await connection.beginTransaction();
    const previous = idOrder == null ? null : await lockOrder(connection, actor.idBusiness, idOrder);
    if (previous) assertOrderEditable(previous.status);
    const snapshots = await loadSnapshots(connection, actor, data);
    const values = [actor.idBusiness, actor.idUser, data.idCustomer, data.idDeposit,
      data.expectedPaymentMethodId ?? null, data.fulfillmentType, JSON.stringify(snapshots.customer),
      data.delivery?.recipientName ?? null, data.delivery?.recipientPhone ?? null,
      data.delivery?.address ?? null, data.delivery?.reference ?? null,
      data.subtotal, data.discountTotal, data.deliveryFee, data.total, data.observation ?? null];
    if (previous) {
      await call(connection, "CALL sp_order_update(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [idOrder, ...values]);
    } else {
      const result = await call<IdRow>(connection, "CALL sp_order_create(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [...values, `PED-${randomUUID()}`, key]);
      savedId = Number(result[0]?.[0]?.idOrder);
      if (!Number.isInteger(savedId) || savedId <= 0) throw new Error("Missing order id");
    }
    // Editable orders replace all details atomically; history stays in order_events.
    for (const product of snapshots.products) {
      const item = data.items.find(function matching(candidate) { return candidate.idProduct === Number(product.idProduct); })!;
      await call(connection, "CALL sp_order_add_detail(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [actor.idBusiness, savedId, item.idProduct, product.name, product.barcode, product.unit_type, product.sale_mode,
          item.quantity, item.unitPrice, item.discount, item.total]);
    }
    await call(connection, "CALL sp_order_add_event(?, ?, ?, ?, ?, ?, ?)",
      [actor.idBusiness, savedId, actor.idUser, previous ? "UPDATED" : "CREATED", previous?.status ?? null, previous?.status ?? "PENDING", null]);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    const dbError = error as { code?: string; sqlMessage?: string };
    if (idOrder == null && key && dbError.code === "ER_DUP_ENTRY" && dbError.sqlMessage?.includes("uq_orders_business_idempotency")) {
      duplicate = error;
    } else {
      throw error;
    }
  } finally { connection.release(); }
  if (duplicate && key) {
    const replay = await findReplay(actor.idBusiness, key);
    if (replay) return { order: replay, idempotentReplay: true };
    throw duplicate;
  }
  return { order: await getOrderService(actor.idBusiness, savedId!), idempotentReplay: false };
}

export async function changeOrderService(actor: OrderActor, idOrder: number, input: unknown, cancel: boolean) {
  const parsed = cancel ? orderCancelSchema.parse(input) : orderStatusSchema.parse(input);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const previous = await lockOrder(connection, actor.idBusiness, idOrder);
    await assertActor(connection, actor);
    const reason = "reason" in parsed ? parsed.reason : null;
    const target = "status" in parsed ? parsed.status : "CANCELLED";
    if (cancel) assertOrderCancellable(previous.status);
    else assertOrderTransition(previous.status, target);
    await call(connection, "CALL sp_order_change_status(?, ?, ?, ?, ?, ?)", [actor.idBusiness, idOrder, actor.idUser, previous.status, target, reason]);
    await call(connection, "CALL sp_order_add_event(?, ?, ?, ?, ?, ?, ?)",
      [actor.idBusiness, idOrder, actor.idUser, cancel ? "CANCELLED" : "STATUS_CHANGED", previous.status, target, reason]);
    await connection.commit();
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
  return getOrderService(actor.idBusiness, idOrder);
}

export async function listOrdersService(idBusiness: number, filters: OrderFilters) {
  const rows = await call<OrderDbRow | SummaryRow>(pool, "CALL sp_order_list(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [idBusiness, filters.status ?? null, filters.idCustomer ?? null, filters.idDeposit ?? null,
      filters.fulfillmentType ?? null, filters.search ?? null, filters.dateFrom ?? null, filters.dateTo ?? null,
      filters.limit, (filters.page - 1) * filters.limit]);
  const summary = rows[1]?.[0] as SummaryRow | undefined;
  const totalRecords = Number(summary?.totalRecords ?? 0);
  return {
    orders: ((rows[0] ?? []) as OrderDbRow[]).map(mapOrder),
    pagination: { totalRecords, currentPage: filters.page, totalPages: Math.max(1, Math.ceil(totalRecords / filters.limit)), limit: filters.limit },
    metrics: { total: totalRecords, totalAmount: Number(summary?.totalAmount ?? 0),
      pending: Number(summary?.pending ?? 0), confirmed: Number(summary?.confirmed ?? 0), preparing: Number(summary?.preparing ?? 0),
      ready: Number(summary?.ready ?? 0), completed: Number(summary?.completed ?? 0), cancelled: Number(summary?.cancelled ?? 0) },
  };
}

export async function orderEventsService(idBusiness: number, idOrder: number) {
  const result = await call<OrderEventDbRow>(pool, "CALL sp_order_events(?, ?)", [idBusiness, idOrder]);
  return (result[0] ?? []).map(mapOrderEvent);
}

export async function orderProductsService(idBusiness: number, idDeposit: number, query: OrderProductsQuery) {
  const result = await call<OrderProductDbRow | SummaryRow>(pool, "CALL sp_order_products(?, ?, ?, ?, ?)",
    [idBusiness, idDeposit, query.search ?? null, query.limit, (query.page - 1) * query.limit]);
  const totalRecords = Number((result[1]?.[0] as SummaryRow | undefined)?.totalRecords ?? 0);
  return { items: ((result[0] ?? []) as OrderProductDbRow[]).map(mapOrderProduct),
    pagination: { totalRecords, currentPage: query.page, totalPages: Math.max(1, Math.ceil(totalRecords / query.limit)), limit: query.limit } };
}
