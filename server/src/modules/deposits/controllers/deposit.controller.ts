import type { Request, Response, NextFunction } from "express";
import {
  createDepositService,
  getDepositByIdService,
  getDepositsService,
  updateDepositService,
} from "../services/deposit.service.js";
import type {
  CreateDepositBody,
  UpdateDepositBody,
} from "../types/deposit.types.js";

export async function createDepositController(
  req: Request<object, object, CreateDepositBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const deposit = await createDepositService(req.user!.idBusiness, req.body);

    res.status(201).json({
      status: "OK",
      message: "Deposito creado correctamente",
      data: deposit,
    });
  } catch (error) {
    next(error);
  }
}

export async function getDepositsController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const deposits = await getDepositsService(req.user!.idBusiness);

    res.status(200).json({
      status: "OK",
      message: "Depositos obtenidos correctamente",
      data: deposits,
    });
  } catch (error) {
    next(error);
  }
}

export async function getDepositByIdController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const deposit = await getDepositByIdService(
      req.user!.idBusiness,
      Number(req.params.idDeposit),
    );

    res.status(200).json({
      status: "OK",
      message: "Deposito obtenido correctamente",
      data: deposit,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateDepositController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const deposit = await updateDepositService(
      req.user!.idBusiness,
      Number(req.params.idDeposit),
      req.body,
    );

    res.status(200).json({
      status: "OK",
      message: "Deposito actualizado correctamente",
      data: deposit,
    });
  } catch (error) {
    next(error);
  }
}
