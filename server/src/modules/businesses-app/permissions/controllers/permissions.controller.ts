import type { Request, Response } from "express";
import {
  getGroupedPermissionsService,
  getPermissionsCatalogService,
} from "../services/permissions.service.js";

export async function getPermissionsController(
  _req: Request,
  res: Response,
): Promise<Response> {
  try {
    const result = await getPermissionsCatalogService();

    return res.status(200).json({
      status: true,
      message: "Permisos obtenidos correctamente",
      data: result,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "No se pudieron obtener permisos";

    return res.status(400).json({
      status: false,
      message,
    });
  }
}

export async function getGroupedPermissionsController(
  _req: Request,
  res: Response,
): Promise<Response> {
  try {
    const result = await getGroupedPermissionsService();

    return res.status(200).json({
      status: true,
      message: "Permisos agrupados obtenidos correctamente",
      data: result,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "No se pudieron obtener permisos";

    return res.status(400).json({
      status: false,
      message,
    });
  }
}
