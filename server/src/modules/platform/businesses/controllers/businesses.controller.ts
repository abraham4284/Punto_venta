import type { Request, Response } from "express";
import { getPaginationParams } from "../../helpers/pagination.helper.js";
import {
  getControllerErrorResponse,
  getPositiveId,
} from "../../helpers/platform-error.helper.js";
import {
  changePlatformBusinessStatusService,
  getPlatformBusinessActivityService,
  getPlatformBusinessByIdService,
  getPlatformBusinessUsageService,
  listPlatformBusinessRecentPurchasesService,
  listPlatformBusinessRecentSalesService,
  listPlatformBusinessUsersService,
  listPlatformBusinessesService,
  resetPlatformBusinessUserPasswordService,
} from "../services/businesses.service.js";
import {
  changePlatformBusinessStatusSchema,
  listPlatformBusinessesQuerySchema,
  resetBusinessUserPasswordSchema,
} from "../validations/businesses.validations.js";

export async function listPlatformBusinessesController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const query = listPlatformBusinessesQuerySchema.parse(req.query);
    const pagination = getPaginationParams(query.page, query.limit);
    const result = await listPlatformBusinessesService(query, pagination);

    return res.status(200).json({
      success: true,
      message: "Negocios obtenidos correctamente",
      data: result,
    });
  } catch (error) {
    const response = getControllerErrorResponse(error);
    return res.status(response.statusCode).json(response.body);
  }
}

export async function getPlatformBusinessByIdController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const idBusiness = getPositiveId(req.params.idBusiness, "El negocio");
    const result = await getPlatformBusinessByIdService(idBusiness);

    return res.status(200).json({
      success: true,
      message: "Negocio obtenido correctamente",
      data: result,
    });
  } catch (error) {
    const response = getControllerErrorResponse(error);
    return res.status(response.statusCode).json(response.body);
  }
}

export async function listPlatformBusinessUsersController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const idBusiness = getPositiveId(req.params.idBusiness, "El negocio");
    const result = await listPlatformBusinessUsersService(idBusiness);

    return res.status(200).json({
      success: true,
      message: "Usuarios del negocio obtenidos correctamente",
      data: result,
    });
  } catch (error) {
    const response = getControllerErrorResponse(error);
    return res.status(response.statusCode).json(response.body);
  }
}

export async function getPlatformBusinessActivityController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const idBusiness = getPositiveId(req.params.idBusiness, "El negocio");
    const result = await getPlatformBusinessActivityService(idBusiness);

    return res.status(200).json({
      success: true,
      message: "Actividad del negocio obtenida correctamente",
      data: result,
    });
  } catch (error) {
    const response = getControllerErrorResponse(error);
    return res.status(response.statusCode).json(response.body);
  }
}

export async function getPlatformBusinessUsageController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const idBusiness = getPositiveId(req.params.idBusiness, "El negocio");
    const result = await getPlatformBusinessUsageService(idBusiness);

    return res.status(200).json({
      success: true,
      message: "Uso del negocio obtenido correctamente",
      data: result,
    });
  } catch (error) {
    const response = getControllerErrorResponse(error);
    return res.status(response.statusCode).json(response.body);
  }
}

export async function listPlatformBusinessRecentSalesController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const idBusiness = getPositiveId(req.params.idBusiness, "El negocio");
    const result = await listPlatformBusinessRecentSalesService(idBusiness);

    return res.status(200).json({
      success: true,
      message: "Ventas recientes obtenidas correctamente",
      data: result,
    });
  } catch (error) {
    const response = getControllerErrorResponse(error);
    return res.status(response.statusCode).json(response.body);
  }
}

export async function listPlatformBusinessRecentPurchasesController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const idBusiness = getPositiveId(req.params.idBusiness, "El negocio");
    const result = await listPlatformBusinessRecentPurchasesService(idBusiness);

    return res.status(200).json({
      success: true,
      message: "Compras recientes obtenidas correctamente",
      data: result,
    });
  } catch (error) {
    const response = getControllerErrorResponse(error);
    return res.status(response.statusCode).json(response.body);
  }
}

export async function changePlatformBusinessStatusController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const idBusiness = getPositiveId(req.params.idBusiness, "El negocio");
    const data = changePlatformBusinessStatusSchema.parse(req.body);
    const result = await changePlatformBusinessStatusService(
      idBusiness,
      data,
      req.auth!.idUser,
      req.ip,
      req.headers["user-agent"],
    );

    return res.status(200).json({
      success: true,
      message: "Estado del negocio actualizado correctamente",
      data: result,
    });
  } catch (error) {
    const response = getControllerErrorResponse(error);
    return res.status(response.statusCode).json(response.body);
  }
}

export async function resetPlatformBusinessUserPasswordController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const idBusiness = getPositiveId(req.params.idBusiness, "El negocio");
    const idUser = getPositiveId(req.params.idUser, "El usuario");
    const data = resetBusinessUserPasswordSchema.parse(req.body ?? {});
    const result = await resetPlatformBusinessUserPasswordService(
      idBusiness,
      idUser,
      data,
      req.auth!.idUser,
      req.ip,
      req.headers["user-agent"],
    );

    return res.status(200).json({
      success: true,
      message: "Contrasena temporal generada correctamente",
      data: {
        ...result,
        warning:
          "Mostra o copia esta contrasena ahora. No se volvera a mostrar por seguridad.",
      },
    });
  } catch (error) {
    const response = getControllerErrorResponse(error);
    return res.status(response.statusCode).json(response.body);
  }
}
