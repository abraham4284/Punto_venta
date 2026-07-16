import type { Request, Response } from "express";
import { z } from "zod";
import {
  createProductService,
  getProductByIdService,
  getProductsService,
  toggleProductStatusService,
  updateProductPricesService,
  updateProductService,
} from "../services/products.service.js";
import {
  createProductSchema,
  toggleProductStatusSchema,
  updateProductPricesSchema,
  updateProductSchema,
} from "../validations/products.validations.js";

function getZodErrors(error: z.ZodError) {
  return error.issues.map(function mapIssue(issue) {
    return {
      field: issue.path.join("."),
      message: issue.message,
    };
  });
}

function getErrorStatus(error: any): number {
  if (error?.sqlState === "45000") {
    return 400;
  }

  return 500;
}

export async function createProductController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const businessData = { ...req.body, idBusiness: req.user!.idBusiness };
    const data = createProductSchema.parse(businessData);
    const result = await createProductService(data);

    return res.status(201).json({
      status: true,
      message: "Producto creado correctamente",
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

export async function getProductsController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const result = await getProductsService(req.user!.idBusiness);

    return res.status(200).json({
      status: true,
      message: "Productos obtenidos correctamente",
      data: result,
    });
  } catch (error: any) {
    return res.status(getErrorStatus(error)).json({
      status: false,
      message: error.sqlMessage || error.message,
    });
  }
}

export async function getProductByIdController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const idProduct = Number(req.params.id);

    if (!Number.isInteger(idProduct) || idProduct <= 0) {
      return res.status(400).json({
        status: false,
        message: "El id del producto debe ser valido",
      });
    }

    const result = await getProductByIdService(req.user!.idBusiness, idProduct);

    return res.status(200).json({
      status: true,
      message: "Producto obtenido correctamente",
      data: result,
    });
  } catch (error: any) {
    return res.status(getErrorStatus(error)).json({
      status: false,
      message: error.sqlMessage || error.message,
    });
  }
}

export async function updateProductController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const businessData = {
      ...req.body,
      idBusiness: req.user!.idBusiness,
      idProduct: Number(req.params.id),
    };
    const data = updateProductSchema.parse(businessData);
    const result = await updateProductService(data);

    return res.status(200).json({
      status: true,
      message: "Producto actualizado correctamente",
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

export async function updateProductPricesController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const productData = {
      ...req.body,
      idBusiness: req.user!.idBusiness,
      idProduct: Number(req.params.idProduct),
    };
    const data = updateProductPricesSchema.parse(productData);
    const result = await updateProductPricesService(data);

    return res.status(200).json({
      status: true,
      message: "Precios del producto actualizados correctamente",
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

export async function toggleProductStatusController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const businessData = {
      ...req.body,
      idBusiness: req.user!.idBusiness,
      idProduct: Number(req.params.id),
    };
    const data = toggleProductStatusSchema.parse(businessData);
    const result = await toggleProductStatusService(data);

    return res.status(200).json({
      status: true,
      message: "Estado del producto actualizado correctamente",
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
