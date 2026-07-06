import type { Request, Response } from "express";
import { z } from "zod";
import {
  createSupplierService,
  getSupplierByIdService,
  getSuppliersService,
  updateSupplierService,
} from "../services/suppliers.service.js";
import {
  createSupplierSchema,
  updateSupplierSchema,
} from "../validations/suppliers.validations.js";

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

export async function createSupplierController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const supplierData = {
      ...req.body,
      idBusiness: req.user!.idBusiness,
    };
    const data = createSupplierSchema.parse(supplierData);
    const result = await createSupplierService(data);

    return res.status(201).json({
      status: true,
      message: "Proveedor creado correctamente",
      data: result,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: false,
        message: "Error de validacion en los datos enviados",
        errors: getZodErrors(error),
      });
    }

    return res.status(getErrorStatus(error)).json({
      status: false,
      message: error.sqlMessage || error.message,
    });
  }
}

export async function getSuppliersController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const result = await getSuppliersService(req.user!.idBusiness);

    return res.status(200).json({
      status: true,
      message: "Proveedores obtenidos correctamente",
      data: result,
    });
  } catch (error: any) {
    return res.status(getErrorStatus(error)).json({
      status: false,
      message: error.sqlMessage || error.message,
    });
  }
}

export async function getSupplierByIdController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const idSupplier = Number(req.params.id);

    if (!Number.isInteger(idSupplier) || idSupplier <= 0) {
      return res.status(400).json({
        status: false,
        message: "El id del proveedor debe ser valido",
      });
    }

    const result = await getSupplierByIdService(
      req.user!.idBusiness,
      idSupplier,
    );

    return res.status(200).json({
      status: true,
      message: "Proveedor obtenido correctamente",
      data: result,
    });
  } catch (error: any) {
    return res.status(getErrorStatus(error)).json({
      status: false,
      message: error.sqlMessage || error.message,
    });
  }
}

export async function updateSupplierController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const supplierData = {
      ...req.body,
      idBusiness: req.user!.idBusiness,
      idSupplier: Number(req.params.id),
    };
    const data = updateSupplierSchema.parse(supplierData);
    const result = await updateSupplierService(data);

    return res.status(200).json({
      status: true,
      message: "Proveedor actualizado correctamente",
      data: result,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: false,
        message: "Error de validacion en los datos enviados",
        errors: getZodErrors(error),
      });
    }

    return res.status(getErrorStatus(error)).json({
      status: false,
      message: error.sqlMessage || error.message,
    });
  }
}
