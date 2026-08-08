import type { Request, Response } from "express";
import { z } from "zod";
import {
  archiveBusinessNotificationService,
  getBusinessNotificationsService,
  getBusinessUnreadNotificationCountService,
  markAllBusinessNotificationsReadService,
  markBusinessNotificationReadService,
} from "@/modules/notifications/services/notifications.service.js";
import {
  notificationIdSchema,
  notificationQuerySchema,
} from "../validations/notifications.validations.js";

function getZodErrors(error: z.ZodError) {
  return error.issues.map(function mapIssue(issue) {
    return {
      field: issue.path.join("."),
      message: issue.message,
    };
  });
}

function getErrorStatus(error: any): number {
  if (error?.sqlState === "45000") return 400;
  return 500;
}

export async function getNotificationsController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const query = notificationQuerySchema.parse(req.query);
    const filters = {
      ...query,
      offset: (query.page - 1) * query.limit,
    };
    const result = await getBusinessNotificationsService(
      req.user!.idBusiness,
      req.user!.idUser,
      filters,
    );

    return res.status(200).json({
      status: true,
      message: "Notificaciones obtenidas correctamente",
      data: result,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: false,
        message: "Error de validacion",
        errors: getZodErrors(error),
      });
    }

    return res.status(getErrorStatus(error)).json({
      status: false,
      message: error.sqlMessage || error.message,
    });
  }
}

export async function getUnreadNotificationCountController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const unreadCount = await getBusinessUnreadNotificationCountService(
      req.user!.idBusiness,
      req.user!.idUser,
    );

    return res.status(200).json({
      status: true,
      message: "Contador obtenido correctamente",
      data: { unreadCount },
    });
  } catch (error: any) {
    return res.status(getErrorStatus(error)).json({
      status: false,
      message: error.sqlMessage || error.message,
    });
  }
}

export async function markNotificationReadController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const { idNotification } = notificationIdSchema.parse(req.params);
    await markBusinessNotificationReadService(
      req.user!.idBusiness,
      req.user!.idUser,
      idNotification,
    );

    return res.status(200).json({
      status: true,
      message: "Notificacion marcada como leida",
      data: null,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: false,
        message: "Error de validacion",
        errors: getZodErrors(error),
      });
    }

    return res.status(getErrorStatus(error)).json({
      status: false,
      message: error.sqlMessage || error.message,
    });
  }
}

export async function markAllNotificationsReadController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    await markAllBusinessNotificationsReadService(
      req.user!.idBusiness,
      req.user!.idUser,
    );

    return res.status(200).json({
      status: true,
      message: "Notificaciones marcadas como leidas",
      data: null,
    });
  } catch (error: any) {
    return res.status(getErrorStatus(error)).json({
      status: false,
      message: error.sqlMessage || error.message,
    });
  }
}

export async function archiveNotificationController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const { idNotification } = notificationIdSchema.parse(req.params);
    await archiveBusinessNotificationService(
      req.user!.idBusiness,
      req.user!.idUser,
      idNotification,
    );

    return res.status(200).json({
      status: true,
      message: "Notificacion archivada correctamente",
      data: null,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: false,
        message: "Error de validacion",
        errors: getZodErrors(error),
      });
    }

    return res.status(getErrorStatus(error)).json({
      status: false,
      message: error.sqlMessage || error.message,
    });
  }
}
