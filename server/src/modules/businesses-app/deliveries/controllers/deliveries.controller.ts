import type { Request, Response } from "express";
import { z } from "zod";
import {
  assignDeliveryService,
  changeDeliveryStatusService,
  getDeliveryByIdService,
  listDeliveriesService,
} from "../services/deliveries.service.js";
import {
  deliveryAssignSchema,
  deliveryIdParamSchema,
  deliveryListQuerySchema,
  deliveryStatusActionSchema,
} from "../validations/deliveries.validations.js";
import type { DeliveryStatus } from "../types/index.js";
import { userHasPermissionService } from "../../permissions/services/permissions.service.js";

interface ControllerError {
  sqlMessage?: string;
  message?: string;
}

function getZodErrors(error: z.ZodError) {
  return error.issues.map(function mapIssue(issue) {
    return {
      field: issue.path.join("."),
      message: issue.message,
    };
  });
}

function getErrorMessage(error: unknown): string {
  const parsed = error as ControllerError;
  return parsed.sqlMessage || parsed.message || "Error inesperado";
}

function parseStatus(value: unknown): DeliveryStatus | null {
  return typeof value === "string" && value.trim() ? (value as DeliveryStatus) : null;
}

async function canViewAllDeliveries(req: Request): Promise<boolean> {
  if (req.user!.role === "OWNER") {
    return true;
  }

  return userHasPermissionService(
    req.user!.idBusiness,
    req.user!.idUser,
    "deliveries.view_all",
  );
}

export async function listDeliveriesController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const data = deliveryListQuerySchema.parse({
      idBusiness: req.user!.idBusiness,
      page: req.query.page,
      limit: req.query.limit,
      status: parseStatus(req.query.status),
      assignedToUserId: req.query.assignedToUserId || null,
      search: req.query.search || null,
    });
    const limit = Number(data.limit);
    const page = Number(data.page);
    const hasViewAll = await canViewAllDeliveries(req);
    const assignedToUserId = hasViewAll ? data.assignedToUserId ?? null : req.user!.idUser;
    const result = await listDeliveriesService({
      ...data,
      page,
      limit,
      offset: (page - 1) * limit,
      assignedToUserId,
    });

    return res.status(200).json({
      status: true,
      message: "Entregas obtenidas correctamente",
      data: result,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: false,
        message: "Error de validacion",
        errors: getZodErrors(error),
      });
    }

    return res.status(400).json({
      status: false,
      message: getErrorMessage(error),
    });
  }
}

export async function getDeliveryByIdController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const data = deliveryIdParamSchema.parse({
      idBusiness: req.user!.idBusiness,
      idSaleDelivery: Number(req.params.id),
    });
    const result = await getDeliveryByIdService(data.idBusiness, data.idSaleDelivery);

    if (!(await canViewAllDeliveries(req)) && result.assignedToUserId !== req.user!.idUser) {
      return res.status(403).json({
        status: false,
        message: "No tenes permisos para ver esta entrega",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Entrega obtenida correctamente",
      data: result,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: false,
        message: "Error de validacion",
        errors: getZodErrors(error),
      });
    }

    return res.status(400).json({
      status: false,
      message: getErrorMessage(error),
    });
  }
}

export async function assignDeliveryController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const data = deliveryAssignSchema.parse({
      ...req.body,
      idBusiness: req.user!.idBusiness,
      idUser: req.user!.idUser,
      idSaleDelivery: Number(req.params.id),
    });
    const result = await assignDeliveryService(data);

    return res.status(200).json({
      status: true,
      message: "Entrega asignada correctamente",
      data: result,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: false,
        message: "Error de validacion",
        errors: getZodErrors(error),
      });
    }

    return res.status(400).json({
      status: false,
      message: getErrorMessage(error),
    });
  }
}

export async function changeDeliveryStatusController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const data = deliveryStatusActionSchema.parse({
      ...req.body,
      idBusiness: req.user!.idBusiness,
      idUser: req.user!.idUser,
      idSaleDelivery: Number(req.params.id),
    });
    const result = await changeDeliveryStatusService({
      ...data,
      status: res.locals.deliveryStatus,
    });

    return res.status(200).json({
      status: true,
      message: "Entrega actualizada correctamente",
      data: result,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: false,
        message: "Error de validacion",
        errors: getZodErrors(error),
      });
    }

    return res.status(400).json({
      status: false,
      message: getErrorMessage(error),
    });
  }
}
