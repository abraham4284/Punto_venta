import type { Request, Response } from "express";
import { z } from "zod";
import {
  getStockMovementsService,
  getStockTransferByReferenceService,
  processStockAdjustmentService,
  processStockTransferService,
  processStockTransfersService,
} from "../services/stock_movements.service.js";
import {
  processStockAdjustmentSchema,
  processStockTransferSchema,
  processStockTransfersSchema,
  stockTransferReferenceSchema,
} from "../validations/stock_movements.validations.js";

function getZodErrors(error: z.ZodError) {
  return error.issues.map(function mapIssue(issue) {
    return {
      field: issue.path.join("."),
      message: issue.message,
    };
  });
}

const transferDomainMessages = new Set([
  "El deposito origen y destino deben ser diferentes",
  "La cantidad debe ser mayor a cero",
  "Los depositos indicados deben pertenecer al negocio y estar activos",
  "El producto indicado debe pertenecer al negocio y estar activo",
  "Los productos por unidad solo permiten cantidades enteras",
  "El producto no tiene stock registrado en el deposito origen",
  "Primero debe dar de alta el stock del producto en el deposito al que desea transferir",
  "Stock insuficiente para realizar la transferencia",
  "La cantidad supera la capacidad de stock del deposito destino",
]);

function sendTransferError(error: unknown, res: Response): Response {
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      status: false,
      message: "Error de validacion",
      errors: getZodErrors(error),
    });
  }

  const db = error as { code?: string; sqlState?: string; sqlMessage?: string } | null;
  if (db?.code === "ER_LOCK_DEADLOCK" || db?.code === "ER_LOCK_WAIT_TIMEOUT") {
    return res.status(409).json({
      status: false,
      code: "STOCK_TRANSFER_CONCURRENT_CHANGE",
      message: "El stock cambio durante la transferencia. Intente nuevamente.",
    });
  }
  if (db?.sqlState === "45000" && db.sqlMessage && transferDomainMessages.has(db.sqlMessage)) {
    return res.status(400).json({ status: false, message: db.sqlMessage });
  }
  return res.status(500).json({ status: false, message: "No se pudo procesar la transferencia de stock" });
}

export async function getStockTransferByReferenceController(req: Request, res: Response): Promise<Response> {
  const reference = stockTransferReferenceSchema.safeParse(req.params.referenceId);
  if (!reference.success) {
    return res.status(400).json({ status: false, message: "Referencia de transferencia inválida" });
  }
  try {
    const transfer = await getStockTransferByReferenceService(req.user!.idBusiness, reference.data);
    if (!transfer) return res.status(404).json({ status: false, message: "Transferencia no encontrada" });
    return res.status(200).json({ status: true, message: "Transferencia obtenida correctamente", data: transfer });
  } catch {
    return res.status(500).json({ status: false, message: "No se pudo obtener la transferencia" });
  }
}

export async function getStockMovementsController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const requestedPage = Number(req.query.page ?? 1);
    const requestedLimit = Number(req.query.limit ?? 15);
    const page =
      Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const limit =
      Number.isInteger(requestedLimit) && requestedLimit > 0
        ? Math.min(requestedLimit, 100)
        : 15;
    const offset = (Number(page) - 1) * Number(limit);
    const idDepositValue = Number(req.query.idDeposit);
    const idDeposit =
      Number.isInteger(idDepositValue) && idDepositValue > 0
        ? idDepositValue
        : null;
    const movementType =
      typeof req.query.movementType === "string"
        ? req.query.movementType
        : null;
    const search =
      typeof req.query.search === "string" ? req.query.search.trim() : null;

    const result = await getStockMovementsService({
      idBusiness: req.user!.idBusiness,
      limit,
      offset,
      movementType,
      idDeposit,
      search,
    });

    return res.status(200).json({
      status: true,
      message: "Movimientos de stock obtenidos correctamente",
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      status: false,
      message: error.sqlMessage || error.message,
    });
  }
}

export async function processStockAdjustmentController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const adjustmentData = {
      ...req.body,
      idBusiness: req.user!.idBusiness,
      idUser: req.user!.idUser,
    };
    const data = processStockAdjustmentSchema.parse(adjustmentData);
    const result = await processStockAdjustmentService(data);

    return res.status(200).json({
      status: true,
      message: "Ajuste de stock procesado correctamente",
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

    return res.status(400).json({
      status: false,
      message: error.sqlMessage || error.message,
    });
  }
}

export async function processStockTransferController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const transferData = {
      ...req.body,
      idBusiness: req.user!.idBusiness,
      idUser: req.user!.idUser,
    };
    const data = processStockTransferSchema.parse(transferData);
    const result = await processStockTransferService(data);

    return res.status(200).json({
      status: true,
      message: "Transferencia de stock procesada correctamente",
      data: result,
    });
  } catch (error) {
    return sendTransferError(error, res);
  }
}

export async function processStockTransfersController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const body = processStockTransfersSchema.parse(req.body);
    const result = await processStockTransfersService({
      ...body,
      idBusiness: req.user!.idBusiness,
      idUser: req.user!.idUser,
    });
    return res.status(200).json({
      status: true,
      message: "Transferencia multiple de stock procesada correctamente",
      data: result,
    });
  } catch (error) {
    return sendTransferError(error, res);
  }
}
