import type { Request, Response } from "express";
import { z } from "zod";
import {
  getPublicCatalogCategoriesService,
  getPublicCatalogProductBySlugService,
  getPublicCatalogProductsService,
  getPublicCatalogService,
  PublicCatalogUnavailableError,
} from "../services/catalog.service.js";
import {
  publicCatalogProductParamsSchema,
  publicCatalogProductsQuerySchema,
} from "../validations/catalog.validations.js";

function getZodErrors(error: z.ZodError) {
  return error.issues.map(function mapIssue(issue) {
    return {
      field: issue.path.join("."),
      message: issue.message,
    };
  });
}

function sendPublicCatalogError(error: unknown, res: Response): Response {
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      status: false,
      message: "Error de validacion",
      errors: getZodErrors(error),
    });
  }

  if (error instanceof PublicCatalogUnavailableError) {
    return res.status(error.statusCode).json({
      status: false,
      message: error.message,
    });
  }

  return res.status(500).json({
    status: false,
    message: "Error interno",
  });
}

export async function getPublicCatalogController(
  _req: Request,
  res: Response,
): Promise<Response> {
  try {
    const result = await getPublicCatalogService();

    return res.status(200).json({
      status: true,
      message: "Catalogo obtenido correctamente",
      data: result,
    });
  } catch (error: unknown) {
    return sendPublicCatalogError(error, res);
  }
}

export async function getPublicCatalogCategoriesController(
  _req: Request,
  res: Response,
): Promise<Response> {
  try {
    const result = await getPublicCatalogCategoriesService();

    return res.status(200).json({
      status: true,
      message: "Categorias obtenidas correctamente",
      data: result,
    });
  } catch (error: unknown) {
    return sendPublicCatalogError(error, res);
  }
}

export async function getPublicCatalogProductsController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const query = publicCatalogProductsQuerySchema.parse(req.query);
    const result = await getPublicCatalogProductsService(query);

    return res.status(200).json({
      status: true,
      message: "Productos obtenidos correctamente",
      data: result,
    });
  } catch (error: unknown) {
    return sendPublicCatalogError(error, res);
  }
}

export async function getPublicCatalogProductBySlugController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const params = publicCatalogProductParamsSchema.parse(req.params);
    const result = await getPublicCatalogProductBySlugService(params.slug);

    return res.status(200).json({
      status: true,
      message: "Producto obtenido correctamente",
      data: result,
    });
  } catch (error: unknown) {
    return sendPublicCatalogError(error, res);
  }
}
