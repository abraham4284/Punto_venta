import type { Request, Response } from "express";
import { z } from "zod";
import {
  archivePlatformNotificationService,
  getPlatformNotificationsService,
  getPlatformRecipientIdByUserIdService,
  getPlatformUnreadNotificationCountService,
  markAllPlatformNotificationsReadService,
  markPlatformNotificationReadService,
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

export async function getPlatformNotificationsController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const idPlatformUser = await getPlatformRecipientIdByUserIdService(
      req.auth!.idUser,
    );
    const query = notificationQuerySchema.parse(req.query);
    const filters = {
      ...query,
      offset: (query.page - 1) * query.limit,
    };
    const result = await getPlatformNotificationsService(idPlatformUser, filters);

    return res.status(200).json({
      success: true,
      message: "Notificaciones obtenidas correctamente",
      data: result,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Error de validacion",
        errors: getZodErrors(error),
      });
    }

    return res.status(getErrorStatus(error)).json({
      success: false,
      message: error.sqlMessage || error.message,
      data: null,
    });
  }
}

export async function getPlatformUnreadNotificationCountController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const idPlatformUser = await getPlatformRecipientIdByUserIdService(
      req.auth!.idUser,
    );
    const unreadCount = await getPlatformUnreadNotificationCountService(
      idPlatformUser,
    );

    return res.status(200).json({
      success: true,
      message: "Contador obtenido correctamente",
      data: { unreadCount },
    });
  } catch (error: any) {
    return res.status(getErrorStatus(error)).json({
      success: false,
      message: error.sqlMessage || error.message,
      data: null,
    });
  }
}

export async function markPlatformNotificationReadController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const idPlatformUser = await getPlatformRecipientIdByUserIdService(
      req.auth!.idUser,
    );
    const { idNotification } = notificationIdSchema.parse(req.params);
    await markPlatformNotificationReadService(idPlatformUser, idNotification);

    return res.status(200).json({
      success: true,
      message: "Notificacion marcada como leida",
      data: null,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Error de validacion",
        errors: getZodErrors(error),
      });
    }

    return res.status(getErrorStatus(error)).json({
      success: false,
      message: error.sqlMessage || error.message,
      data: null,
    });
  }
}

export async function markAllPlatformNotificationsReadController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const idPlatformUser = await getPlatformRecipientIdByUserIdService(
      req.auth!.idUser,
    );
    await markAllPlatformNotificationsReadService(idPlatformUser);

    return res.status(200).json({
      success: true,
      message: "Notificaciones marcadas como leidas",
      data: null,
    });
  } catch (error: any) {
    return res.status(getErrorStatus(error)).json({
      success: false,
      message: error.sqlMessage || error.message,
      data: null,
    });
  }
}

export async function archivePlatformNotificationController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const idPlatformUser = await getPlatformRecipientIdByUserIdService(
      req.auth!.idUser,
    );
    const { idNotification } = notificationIdSchema.parse(req.params);
    await archivePlatformNotificationService(idPlatformUser, idNotification);

    return res.status(200).json({
      success: true,
      message: "Notificacion archivada correctamente",
      data: null,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Error de validacion",
        errors: getZodErrors(error),
      });
    }

    return res.status(getErrorStatus(error)).json({
      success: false,
      message: error.sqlMessage || error.message,
      data: null,
    });
  }
}
