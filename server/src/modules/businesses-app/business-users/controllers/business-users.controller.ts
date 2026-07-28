import type { Request, Response } from "express";
import { z } from "zod";
import {
  changeBusinessUserRoleService,
  changeBusinessUserStatusService,
  createBusinessUserService,
  getBusinessUserByIdService,
  getBusinessUserPermissionsService,
  listBusinessUsersService,
  resetBusinessUserPermissionsService,
  updateBusinessUserPermissionsService,
  updateBusinessUserService,
} from "../services/business-users.service.js";
import {
  changeBusinessUserRoleSchema,
  changeBusinessUserStatusSchema,
  createBusinessUserSchema,
  listBusinessUsersQuerySchema,
  updateBusinessUserPermissionsSchema,
  updateBusinessUserSchema,
} from "../validations/business-users.validations.js";
import type {
  BusinessUserListFilters,
  BusinessUserStatusFilter,
} from "../types/index.js";
import type { BusinessRole } from "@/types/auth.types.js";
import { isSubscriptionResourceLimitError } from "../../subscription/services/subscription-limits.service.js";

function getZodErrors(error: z.ZodError) {
  return error.issues.map(function mapIssue(issue) {
    return {
      field: issue.path.join("."),
      message: issue.message,
    };
  });
}

function getPositiveId(value: unknown, label: string): number {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`${label} debe ser valido`);
  }

  return id;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Error al procesar usuarios";
}

function getErrorStatus(message: string): number {
  if (
    message === "BUSINESS_USER_LIMIT_REACHED" ||
    message === "BUSINESS_USER_ALREADY_EXISTS"
  ) {
    return 409;
  }

  if (
    message === "CANNOT_MODIFY_OWNER" ||
    message === "CANNOT_DEACTIVATE_LAST_OWNER" ||
    message === "CANNOT_DEACTIVATE_SELF"
  ) {
    return 403;
  }

  if (message === "BUSINESS_USER_NOT_FOUND") {
    return 404;
  }

  return 400;
}

function buildListFilters(query: unknown): BusinessUserListFilters {
  const parsed = listBusinessUsersQuerySchema.parse(query);

  return {
    search: parsed.search || null,
    role: parsed.role === "ALL" ? null : (parsed.role as BusinessRole),
    status:
      parsed.status === "ALL"
        ? null
        : (parsed.status as BusinessUserStatusFilter),
    page: parsed.page,
    limit: parsed.limit,
    offset: (parsed.page - 1) * parsed.limit,
  };
}

function handleControllerError(error: unknown, res: Response): Response {
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      status: false,
      message: "Error de validacion",
      errors: getZodErrors(error),
    });
  }

  if (isSubscriptionResourceLimitError(error)) {
    return res.status(error.statusCode).json({
      status: false,
      code: error.code,
      message: error.message,
      data: error.data,
    });
  }

  const message = getErrorMessage(error);

  return res.status(getErrorStatus(message)).json({
    status: false,
    code: message,
    message,
  });
}

export async function listBusinessUsersController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const filters = buildListFilters(req.query);
    const result = await listBusinessUsersService(
      req.user!.idBusiness,
      filters,
    );

    return res.status(200).json({
      status: true,
      message: "Usuarios obtenidos correctamente",
      data: result,
    });
  } catch (error: unknown) {
    return handleControllerError(error, res);
  }
}

export async function getBusinessUserByIdController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const idUser = getPositiveId(req.params.idUser, "El usuario");
    const result = await getBusinessUserByIdService(
      req.user!.idBusiness,
      idUser,
    );

    return res.status(200).json({
      status: true,
      message: "Usuario obtenido correctamente",
      data: result,
    });
  } catch (error: unknown) {
    return handleControllerError(error, res);
  }
}

export async function createBusinessUserController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const data = createBusinessUserSchema.parse(req.body);
    const result = await createBusinessUserService({
      idBusiness: req.user!.idBusiness,
      actorUserId: req.user!.idUser,
      ...data,
      email: data.email ?? null,
    });

    return res.status(201).json({
      status: true,
      message: "Usuario creado correctamente",
      data: result,
    });
  } catch (error: unknown) {
    return handleControllerError(error, res);
  }
}

export async function updateBusinessUserController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const idUser = getPositiveId(req.params.idUser, "El usuario");
    const data = updateBusinessUserSchema.parse(req.body);
    const result = await updateBusinessUserService({
      idBusiness: req.user!.idBusiness,
      idUser,
      ...data,
      email: data.email ?? null,
    });

    return res.status(200).json({
      status: true,
      message: "Usuario actualizado correctamente",
      data: result,
    });
  } catch (error: unknown) {
    return handleControllerError(error, res);
  }
}

export async function changeBusinessUserRoleController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const idUser = getPositiveId(req.params.idUser, "El usuario");
    const data = changeBusinessUserRoleSchema.parse(req.body);
    const result = await changeBusinessUserRoleService({
      idBusiness: req.user!.idBusiness,
      idUser,
      role: data.role,
    });

    return res.status(200).json({
      status: true,
      message: "Rol actualizado correctamente",
      data: result,
    });
  } catch (error: unknown) {
    return handleControllerError(error, res);
  }
}

export async function changeBusinessUserStatusController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const idUser = getPositiveId(req.params.idUser, "El usuario");
    const data = changeBusinessUserStatusSchema.parse(req.body);
    const result = await changeBusinessUserStatusService({
      idBusiness: req.user!.idBusiness,
      actorUserId: req.user!.idUser,
      idUser,
      isActive: data.isActive,
    });

    return res.status(200).json({
      status: true,
      message: "Estado actualizado correctamente",
      data: result,
    });
  } catch (error: unknown) {
    return handleControllerError(error, res);
  }
}

export async function getBusinessUserPermissionsController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const idUser = getPositiveId(req.params.idUser, "El usuario");
    const result = await getBusinessUserPermissionsService(
      req.user!.idBusiness,
      idUser,
    );

    return res.status(200).json({
      status: true,
      message: "Permisos obtenidos correctamente",
      data: result,
    });
  } catch (error: unknown) {
    return handleControllerError(error, res);
  }
}

export async function updateBusinessUserPermissionsController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const idUser = getPositiveId(req.params.idUser, "El usuario");
    const data = updateBusinessUserPermissionsSchema.parse(req.body);
    const result = await updateBusinessUserPermissionsService({
      idBusiness: req.user!.idBusiness,
      actorUserId: req.user!.idUser,
      idUser,
      permissions: data.permissions,
    });

    return res.status(200).json({
      status: true,
      message: "Permisos actualizados correctamente",
      data: result,
    });
  } catch (error: unknown) {
    return handleControllerError(error, res);
  }
}

export async function resetBusinessUserPermissionsController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const idUser = getPositiveId(req.params.idUser, "El usuario");
    const result = await resetBusinessUserPermissionsService(
      req.user!.idBusiness,
      idUser,
    );

    return res.status(200).json({
      status: true,
      message: "Permisos restablecidos correctamente",
      data: result,
    });
  } catch (error: unknown) {
    return handleControllerError(error, res);
  }
}
