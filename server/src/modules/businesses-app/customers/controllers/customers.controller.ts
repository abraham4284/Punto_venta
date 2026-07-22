import type { Request, Response } from "express";
import { z } from "zod";
import {
  createCustomerService,
  getCustomerByIdService,
  getCustomersService,
  toggleCustomerStatusService,
  updateCustomerService,
} from "../services/customers.service.js";
import {
  createCustomerSchema,
  toggleCustomerStatusSchema,
  updateCustomerSchema,
} from "../validations/customers.validations.js";

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

export async function createCustomerController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const customerData = { ...req.body, idBusiness: req.user!.idBusiness };
    const data = createCustomerSchema.parse(customerData);
    const result = await createCustomerService(data);

    return res.status(201).json({
      status: true,
      message: "Cliente creado correctamente",
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

export async function getCustomersController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const result = await getCustomersService(req.user!.idBusiness);

    return res.status(200).json({
      status: true,
      message: "Clientes obtenidos correctamente",
      data: result,
    });
  } catch (error: any) {
    return res.status(getErrorStatus(error)).json({
      status: false,
      message: error.sqlMessage || error.message,
    });
  }
}

export async function getCustomerByIdController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const idCustomer = Number(req.params.id);

    if (!Number.isInteger(idCustomer) || idCustomer <= 0) {
      return res.status(400).json({
        status: false,
        message: "El id del cliente debe ser valido",
      });
    }

    const result = await getCustomerByIdService(
      req.user!.idBusiness,
      idCustomer,
    );

    return res.status(200).json({
      status: true,
      message: "Cliente obtenido correctamente",
      data: result,
    });
  } catch (error: any) {
    return res.status(getErrorStatus(error)).json({
      status: false,
      message: error.sqlMessage || error.message,
    });
  }
}

export async function updateCustomerController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const customerData = {
      ...req.body,
      idBusiness: req.user!.idBusiness,
      idCustomer: Number(req.params.id),
    };
    const data = updateCustomerSchema.parse(customerData);
    const result = await updateCustomerService(data);

    return res.status(200).json({
      status: true,
      message: "Cliente actualizado correctamente",
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

export async function toggleCustomerStatusController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const customerData = {
      ...req.body,
      idBusiness: req.user!.idBusiness,
      idCustomer: Number(req.params.id),
    };
    const data = toggleCustomerStatusSchema.parse(customerData);
    const result = await toggleCustomerStatusService(data);

    return res.status(200).json({
      status: true,
      message: "Estado del cliente actualizado correctamente",
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
