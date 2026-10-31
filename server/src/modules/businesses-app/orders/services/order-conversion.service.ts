import type { RowDataPacket } from "mysql2/promise";
import { pool } from "@/db/db.js";
import {
  createSaleWithinTransaction,
  getSaleByIdService,
} from "../../sales/services/sales.service.js";
import { createSaleSchema } from "../../sales/validations/sales.validations.js";
import { safeEvaluateStockNotification } from "@/modules/notifications/services/notifications.service.js";
import { OrderError } from "../helpers/orders.helper.js";
import { getOrderService } from "./orders.service.js";
import { orderKeySchema } from "../validations/orders.validations.js";
import { orderConversionSchema } from "../validations/order-conversion.validations.js";
import type {
  OrderActor,
  OrderDbRow,
  OrderDetailDbRow,
} from "../types/index.js";

interface LinkedSaleRow extends RowDataPacket {
  idSale: number;
  idOrder: number | null;
  idempotency_key: string;
}

export async function convertOrderToSaleService(
  actor: OrderActor,
  idOrder: number,
  input: unknown,
  key: string,
) {
  const data = orderConversionSchema.parse(input);
  const idempotencyKey = orderKeySchema.parse(key);
  const connection = await pool.getConnection();
  let idSale: number;
  let replay = false;
  let notificationItems: number[] = [];
  let idDeposit = 0;
  try {
    await connection.beginTransaction();
    const [locked] = await connection.query<RowDataPacket[]>(
      "CALL sp_order_lock(?, ?)",
      [actor.idBusiness, idOrder],
    );
    const order = (locked as unknown as OrderDbRow[][])[0]?.[0];
    if (!order)
      throw new OrderError(404, "ORDER_NOT_FOUND", "Pedido no encontrado");
    const [users] = await connection.query<RowDataPacket[]>(
      "SELECT bu.idUser FROM business_users bu JOIN users u ON u.idUser = bu.idUser WHERE bu.idBusiness = ? AND bu.idUser = ? AND bu.is_active = 1 AND u.is_active = 1 FOR UPDATE",
      [actor.idBusiness, actor.idUser],
    );
    if (!users.length)
      throw new OrderError(
        403,
        "ORDER_ACTOR_INVALID",
        "Usuario no habilitado en el negocio",
      );
    // Current locking read after the Order lock: concurrent conversions see the committed link.
    const [sales] = await connection.query<LinkedSaleRow[]>(
      "SELECT idSale, idOrder, idempotency_key FROM sales WHERE idBusiness = ? AND (idOrder = ? OR idempotency_key = ?) FOR UPDATE",
      [actor.idBusiness, idOrder, idempotencyKey],
    );
    const collision = sales.find(function foreign(sale) {
      return (
        sale.idempotency_key.toLowerCase() === idempotencyKey.toLowerCase() &&
        Number(sale.idOrder) !== idOrder
      );
    });
    if (collision)
      throw new OrderError(
        409,
        "IDEMPOTENCY_KEY_CONFLICT",
        "La clave ya pertenece a otra venta",
      );
    const linked = sales.find(function matching(sale) {
      return Number(sale.idOrder) === idOrder;
    });
    if ((order.status === "COMPLETED") !== Boolean(linked)) {
      throw new OrderError(
        409,
        "ORDER_SALE_INCONSISTENT",
        "Estado de pedido y venta incompatible",
      );
    }
    if (order.status === "COMPLETED" && linked) {
      idSale = Number(linked.idSale);
      replay = true;
    } else {
      if (order.status !== "READY")
        throw new OrderError(
          409,
          "ORDER_NOT_READY",
          "Solo se pueden convertir pedidos listos",
        );
      if (order.fulfillment_type === "PICKUP" && data.delivery != null) {
        throw new OrderError(
          400,
          "ORDER_PICKUP_DELIVERY_NOT_ALLOWED",
          "Un retiro no admite datos de entrega",
        );
      }
      const [result] = await connection.query<RowDataPacket[]>(
        "CALL sp_order_get(?, ?)",
        [actor.idBusiness, idOrder],
      );
      const details =
        (result as unknown as [OrderDbRow[], OrderDetailDbRow[]])[1] ?? [];
      // Parse the derived payload with Sales rules. Incompatible stored values are rejected, never adjusted.
      const payload = createSaleSchema.parse({
        ...actor,
        idempotencyKey,
        idCashSession: data.idCashSession,
        idCustomer: Number(order.idCustomer),
        idDeposit: Number(order.idDeposit),
        subtotal: Number(order.subtotal),
        discountTotal: Number(order.discount_total),
        deliveryFee: Number(order.delivery_fee),
        total: Number(order.total),
        // A longer note remains intact on Order, linked by sales.idOrder.
        observation:
          order.observation && order.observation.length <= 255
            ? order.observation
            : null,
        payments: data.payments,
        delivery:
          order.fulfillment_type === "DELIVERY"
            ? {
                ...data.delivery,
                recipientName: order.delivery_recipient_name,
                recipientPhone: order.delivery_recipient_phone,
                deliveryAddress: order.delivery_address,
                deliveryReference: order.delivery_reference,
              }
            : null,
        items: details.map(function item(line) {
          return {
            idProduct: Number(line.idProduct),
            quantity: Number(line.quantity),
            unitPrice: Number(line.unit_price),
            discount: Number(line.discount),
            total: Number(line.total),
          };
        }),
      });
      const created = await createSaleWithinTransaction(connection, {
        ...payload,
        idOrder,
      });
      if (created.alreadyProcessed)
        throw new OrderError(
          409,
          "ORDER_SALE_INCONSISTENT",
          "La venta ya existia sin completar el pedido",
        );
      idSale = Number(created.idSale);
      await connection.query("CALL sp_order_complete_from_sale(?, ?, ?, ?)", [
        actor.idBusiness,
        idOrder,
        actor.idUser,
        idSale,
      ]);
      await connection.query("CALL sp_order_add_event(?, ?, ?, ?, ?, ?, ?)", [
        actor.idBusiness,
        idOrder,
        actor.idUser,
        "STATUS_CHANGED",
        "READY",
        "COMPLETED",
        null,
      ]);
      idDeposit = payload.idDeposit;
      notificationItems = payload.items.map(function product(item) {
        return item.idProduct;
      });
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    const db = error as { code?: string; sqlMessage?: string };
    if (
      db.code === "ER_DUP_ENTRY" &&
      db.sqlMessage?.includes("uq_sales_business_idempotency")
    ) {
      throw new OrderError(
        409,
        "IDEMPOTENCY_KEY_CONFLICT",
        "La clave ya pertenece a otra venta; reintente con otra clave",
      );
    }
    throw error;
  } finally {
    connection.release();
  }
  // Post-commit reads/notifications cannot roll back the confirmed conversion. Retry returns the link.
  for (const idProduct of notificationItems)
    await safeEvaluateStockNotification({
      idBusiness: actor.idBusiness,
      idDeposit,
      idProduct,
    });
  return {
    order: await getOrderService(actor.idBusiness, idOrder),
    sale: await getSaleByIdService(actor.idBusiness, idSale),
    idempotentReplay: replay,
  };
}
