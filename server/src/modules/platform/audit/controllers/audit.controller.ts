import type { Request, Response } from "express";
import { listPlatformAuditQuerySchema } from "../validations/audit.validations.js";
import { getPaginationParams } from "../../helpers/pagination.helper.js";
import {
  getControllerErrorResponse,
  getPositiveId,
} from "../../helpers/platform-error.helper.js";
import {
  getPlatformAuditLogByIdService,
  listPlatformAuditLogsService,
} from "../services/audit.service.js";

export async function listPlatformAuditLogsController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const query = listPlatformAuditQuerySchema.parse(req.query);
    const pagination = getPaginationParams(query.page, query.limit);
    const result = await listPlatformAuditLogsService(query, pagination);

    return res.status(200).json({
      success: true,
      message: "Auditoria obtenida correctamente",
      data: result,
    });
  } catch (error) {
    const response = getControllerErrorResponse(error);
    return res.status(response.statusCode).json(response.body);
  }
}

export async function getPlatformAuditLogByIdController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const id = getPositiveId(req.params.idPlatformAuditLog, "La auditoria");
    const result = await getPlatformAuditLogByIdService(id);

    return res.status(200).json({
      success: true,
      message: "Auditoria obtenida correctamente",
      data: result,
    });
  } catch (error) {
    const response = getControllerErrorResponse(error);
    return res.status(response.statusCode).json(response.body);
  }
}
