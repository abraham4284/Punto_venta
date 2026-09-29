import type { Request, Response } from "express";
import { z } from "zod";
import {
  createProductImageService,
  deleteProductImageService,
  getProductImagesService,
  reorderProductImagesService,
} from "../services/product-images.service.js";
import {
  createProductImageBodySchema,
  productImagesImageParamsSchema,
  productImagesProductParamsSchema,
  reorderProductImagesBodySchema,
} from "../validations/product-images.validations.js";

function getZodErrors(error: z.ZodError) {
  return error.issues.map(function mapIssue(issue) {
    return {
      field: issue.path.join("."),
      message: issue.message,
    };
  });
}

interface ControllerError {
  sqlState?: string;
  sqlMessage?: string;
  message?: string;
}

function getErrorStatus(error: ControllerError): number {
  if (error.sqlState === "45000") {
    return 400;
  }

  if (!error.sqlState && error.message) {
    return 400;
  }

  return 500;
}

function getErrorMessage(error: ControllerError): string {
  return error.sqlMessage || error.message || "Error interno";
}

export async function getProductImagesController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const params = productImagesProductParamsSchema.parse(req.params);
    const result = await getProductImagesService(
      req.user!.idBusiness,
      params.idProduct,
    );

    return res.status(200).json({
      status: true,
      message: "Imagenes del producto obtenidas correctamente",
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

    const typedError = error as ControllerError;
    return res.status(getErrorStatus(typedError)).json({
      status: false,
      message: getErrorMessage(typedError),
    });
  }
}

export async function createProductImageController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const params = productImagesProductParamsSchema.parse(req.params);
    const body = createProductImageBodySchema.parse(req.body);
    const result = await createProductImageService({
      idBusiness: req.user!.idBusiness,
      idProduct: params.idProduct,
      imageUrl: body.imageUrl,
      altText: body.altText,
    });

    return res.status(201).json({
      status: true,
      message: "Imagen agregada correctamente",
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

    const typedError = error as ControllerError;
    return res.status(getErrorStatus(typedError)).json({
      status: false,
      message: getErrorMessage(typedError),
    });
  }
}

export async function reorderProductImagesController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const params = productImagesProductParamsSchema.parse(req.params);
    const body = reorderProductImagesBodySchema.parse(req.body);
    const result = await reorderProductImagesService({
      idBusiness: req.user!.idBusiness,
      idProduct: params.idProduct,
      imageIds: body.imageIds,
    });

    return res.status(200).json({
      status: true,
      message: "Orden de imagenes actualizado correctamente",
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

    const typedError = error as ControllerError;
    return res.status(getErrorStatus(typedError)).json({
      status: false,
      message: getErrorMessage(typedError),
    });
  }
}

export async function deleteProductImageController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const params = productImagesImageParamsSchema.parse(req.params);

    await deleteProductImageService(
      req.user!.idBusiness,
      params.idProduct,
      params.idProductImage,
    );

    return res.status(200).json({
      status: true,
      message: "Imagen eliminada correctamente",
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: false,
        message: "Error de validacion",
        errors: getZodErrors(error),
      });
    }

    const typedError = error as ControllerError;
    return res.status(getErrorStatus(typedError)).json({
      status: false,
      message: getErrorMessage(typedError),
    });
  }
}
