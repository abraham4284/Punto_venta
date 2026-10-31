import { convertOrderToSaleService } from "../services/order-conversion.service.js";
import type { Request, Response } from "express";
import { z } from "zod";
import {
  getIdempotencyKeyFromRequest,
  isIdempotencyError,
} from "@/helpers/idempotency.helper.js";
import { OrderError } from "../helpers/orders.helper.js";
import {
  changeOrderService,
  getOrderService,
  listOrdersService,
  orderEventsService,
  orderProductsService,
  saveOrderService,
} from "../services/orders.service.js";
import {
  orderBodySchema,
  orderCancelSchema,
  orderFiltersSchema,
  orderIdSchema,
  orderProductsQuerySchema,
  orderStatusSchema,
} from "../validations/orders.validations.js";

function actor(req: Request) {
  if (!req.user)
    throw new OrderError(
      403,
      "BUSINESS_CONTEXT_REQUIRED",
      "Contexto de negocio requerido",
    );
  return { idBusiness: req.user.idBusiness, idUser: req.user.idUser };
}
function fail(res: Response, error: unknown) {
  if (error instanceof z.ZodError)
    return res.status(400).json({
      status: false,
      message: "Error de validacion",
      errors: error.issues.map(function issue(value) {
        return { field: value.path.join("."), message: value.message };
      }),
    });
  if (error instanceof OrderError)
    return res
      .status(error.statusCode)
      .json({ status: false, code: error.code, message: error.message });
  if (error instanceof Error && isIdempotencyError(error.message)) {
    return res
      .status(400)
      .json({
        status: false,
        code: error.message,
        message: "Debe enviar un Idempotency-Key UUID valido",
      });
  }
  const db = error as { code?: string; sqlMessage?: string } | null;
  const known: Record<string, [number, string]> = {
    ORDER_NOT_FOUND: [404, "Pedido no encontrado"],
    IDEMPOTENCY_KEY_CONFLICT: [409, "La clave ya pertenece a otra venta"],
    ORDER_SALE_INCONSISTENT: [409, "Estado de pedido y venta incompatible"],
    OPEN_CASH_SESSION_REQUIRED: [409, "Se requiere una caja abierta"],
    CASH_SESSION_NOT_FOUND: [409, "Caja no disponible en el negocio"],
    CASH_SESSION_CLOSED: [409, "La caja esta cerrada"],
    CASH_REGISTER_INACTIVE: [409, "La caja esta inactiva"],
    PAYMENT_METHOD_NOT_FOUND: [400, "Metodo de pago no disponible"],
    PAYMENT_METHOD_INACTIVE: [409, "Metodo de pago inactivo"],
    DELIVERY_PROVIDER_INVALID: [400, "La asignacion del proveedor no es valida"],
    DELIVERY_USER_NOT_FOUND: [400, "Cadete no disponible en el negocio"],
    "Stock insuficiente para procesar la venta": [
      409,
      "Stock insuficiente para procesar la venta",
    ],
    "Usuario no autorizado para registrar ventas": [
      403,
      "Usuario no habilitado en el negocio",
    ],
    "El deposito indicado no pertenece al negocio o esta inactivo": [
      400,
      "Deposito no disponible en el negocio",
    ],
    "El cliente indicado no pertenece al negocio o esta inactivo": [
      400,
      "Cliente no disponible en el negocio",
    ],
    "El producto indicado no existe o esta inactivo": [
      400,
      "Producto no disponible en el negocio",
    ],
    "Los productos por unidad solo permiten cantidades enteras": [
      400,
      "Cantidad incompatible con la unidad actual",
    ],
    ORDER_DEPOSIT_INVALID: [400, "Deposito no disponible en el negocio"],
    ORDER_NOT_EDITABLE: [409, "El pedido ya no admite edicion"],
    ORDER_INVALID_TRANSITION: [409, "Transicion de pedido no permitida"],
  };
  const mapped = db?.sqlMessage ? known[db.sqlMessage] : undefined;
  if (mapped)
    return res
      .status(mapped[0])
      .json({ status: false, code: db?.sqlMessage, message: mapped[1] });
  if (db?.code === "ER_LOCK_DEADLOCK" || db?.code === "ER_LOCK_WAIT_TIMEOUT") {
    return res
      .status(409)
      .json({
        status: false,
        code: "ORDER_CONCURRENT_CHANGE",
        message: "El pedido cambio concurrentemente; reintente la operacion",
      });
  }
  return res
    .status(500)
    .json({
      status: false,
      message: "No se pudo procesar la solicitud de pedidos",
    });
}
function success(res: Response, data: unknown) {
  return res
    .status(200)
    .json({ status: true, message: "Solicitud de pedidos procesada", data });
}

export async function createOrderController(req: Request, res: Response) {
  try {
    const context = actor(req);
    const result = await saveOrderService(
      context,
      orderBodySchema.parse(req.body),
      getIdempotencyKeyFromRequest(req),
    );
    return res
      .status(result.idempotentReplay ? 200 : 201)
      .json({
        status: true,
        message: "Pedido registrado",
        data: result.order,
        idempotentReplay: result.idempotentReplay,
      });
  } catch (error) {
    return fail(res, error);
  }
}
export async function listOrdersController(req: Request, res: Response) {
  try {
    return success(
      res,
      await listOrdersService(
        actor(req).idBusiness,
        orderFiltersSchema.parse(req.query),
      ),
    );
  } catch (error) {
    return fail(res, error);
  }
}
export async function getOrderController(req: Request, res: Response) {
  try {
    return success(
      res,
      await getOrderService(
        actor(req).idBusiness,
        orderIdSchema.parse(req.params.id),
      ),
    );
  } catch (error) {
    return fail(res, error);
  }
}
export async function updateOrderController(req: Request, res: Response) {
  try {
    const result = await saveOrderService(
      actor(req),
      orderBodySchema.parse(req.body),
      undefined,
      orderIdSchema.parse(req.params.id),
    );
    return success(res, result.order);
  } catch (error) {
    return fail(res, error);
  }
}
export async function orderStatusController(req: Request, res: Response) {
  try {
    return success(
      res,
      await changeOrderService(
        actor(req),
        orderIdSchema.parse(req.params.id),
        orderStatusSchema.parse(req.body),
        false,
      ),
    );
  } catch (error) {
    return fail(res, error);
  }
}
export async function cancelOrderController(req: Request, res: Response) {
  try {
    return success(
      res,
      await changeOrderService(
        actor(req),
        orderIdSchema.parse(req.params.id),
        orderCancelSchema.parse(req.body),
        true,
      ),
    );
  } catch (error) {
    return fail(res, error);
  }
}
export async function orderEventsController(req: Request, res: Response) {
  try {
    return success(
      res,
      await orderEventsService(
        actor(req).idBusiness,
        orderIdSchema.parse(req.params.id),
      ),
    );
  } catch (error) {
    return fail(res, error);
  }
}
export async function orderProductsController(req: Request, res: Response) {
  try {
    return success(
      res,
      await orderProductsService(
        actor(req).idBusiness,
        orderIdSchema.parse(req.params.idDeposit),
        orderProductsQuerySchema.parse(req.query),
      ),
    );
  } catch (error) {
    return fail(res, error);
  }
}

export async function convertOrderController(req: Request, res: Response) {
  try {
    const result = await convertOrderToSaleService(
      actor(req),
      orderIdSchema.parse(req.params.id),
      req.body,
      getIdempotencyKeyFromRequest(req),
    );
    return res
      .status(result.idempotentReplay ? 200 : 201)
      .json({
        status: true,
        message: "Pedido convertido a venta",
        data: { order: result.order, sale: result.sale },
        idempotentReplay: result.idempotentReplay,
      });
  } catch (error) {
    return fail(res, error);
  }
}
