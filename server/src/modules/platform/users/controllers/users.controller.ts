import type { Request, Response } from "express";
import { getPaginationParams } from "../../helpers/pagination.helper.js";
import {
  getControllerErrorResponse,
  getPositiveId,
} from "../../helpers/platform-error.helper.js";
import {
  changePlatformUserRoleService,
  changePlatformUserStatusService,
  createPlatformUserAdminService,
  getPlatformUserByIdService,
  listPlatformUsersService,
  revokePlatformUserSessionsService,
} from "../services/users.service.js";
import {
  changePlatformUserRoleSchema,
  changePlatformUserStatusSchema,
  createPlatformUserSchema,
  listPlatformUsersQuerySchema,
  revokePlatformUserSessionsSchema,
} from "../validations/users.validations.js";

export async function listPlatformUsersController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const query = listPlatformUsersQuerySchema.parse(req.query);
    const pagination = getPaginationParams(query.page, query.limit);
    const result = await listPlatformUsersService(query, pagination);

    return res.status(200).json({
      success: true,
      message: "Usuarios de plataforma obtenidos correctamente",
      data: result,
    });
  } catch (error) {
    const response = getControllerErrorResponse(error);
    return res.status(response.statusCode).json(response.body);
  }
}

export async function getPlatformUserByIdController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const id = getPositiveId(req.params.idPlatformUser, "El usuario");
    const result = await getPlatformUserByIdService(id);

    return res.status(200).json({
      success: true,
      message: "Usuario de plataforma obtenido correctamente",
      data: result,
    });
  } catch (error) {
    const response = getControllerErrorResponse(error);
    return res.status(response.statusCode).json(response.body);
  }
}

export async function createPlatformUserAdminController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const data = createPlatformUserSchema.parse(req.body);
    const result = await createPlatformUserAdminService(
      data,
      req.auth!.idUser,
      req.ip,
      req.headers["user-agent"],
    );

    return res.status(201).json({
      success: true,
      message: "Usuario de plataforma creado correctamente",
      data: result,
    });
  } catch (error) {
    const response = getControllerErrorResponse(error);
    return res.status(response.statusCode).json(response.body);
  }
}

export async function changePlatformUserRoleController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const id = getPositiveId(req.params.idPlatformUser, "El usuario");
    const data = changePlatformUserRoleSchema.parse(req.body);
    const result = await changePlatformUserRoleService(
      id,
      data,
      req.auth!.idUser,
      req.ip,
      req.headers["user-agent"],
    );

    return res.status(200).json({
      success: true,
      message: "Rol de plataforma actualizado correctamente",
      data: result,
    });
  } catch (error) {
    const response = getControllerErrorResponse(error);
    return res.status(response.statusCode).json(response.body);
  }
}

export async function changePlatformUserStatusController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const id = getPositiveId(req.params.idPlatformUser, "El usuario");
    const data = changePlatformUserStatusSchema.parse(req.body);
    const result = await changePlatformUserStatusService(
      id,
      data,
      req.auth!.idUser,
      req.ip,
      req.headers["user-agent"],
    );

    return res.status(200).json({
      success: true,
      message: "Estado del usuario actualizado correctamente",
      data: result,
    });
  } catch (error) {
    const response = getControllerErrorResponse(error);
    return res.status(response.statusCode).json(response.body);
  }
}

export async function revokePlatformUserSessionsController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const id = getPositiveId(req.params.idPlatformUser, "El usuario");
    const data = revokePlatformUserSessionsSchema.parse(req.body);
    const result = await revokePlatformUserSessionsService(
      id,
      data,
      req.auth!.idUser,
      req.ip,
      req.headers["user-agent"],
    );

    return res.status(200).json({
      success: true,
      message: "Sesiones revocadas correctamente",
      data: result,
    });
  } catch (error) {
    const response = getControllerErrorResponse(error);
    return res.status(response.statusCode).json(response.body);
  }
}
