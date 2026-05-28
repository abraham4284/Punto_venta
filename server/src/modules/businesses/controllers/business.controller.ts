import type { Request, Response, NextFunction } from "express";
import {
  getBusinessService,
  updateBusinessService,
} from "../services/business.service.js";
import type { UpdateBusinessBody } from "../types/business.types.js";

export const getBusinessController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const business = await getBusinessService(req.user!.idBusiness);
    res.status(200).json({
      status: "OK",
      message: "Negocio obtenido correctamente",
      data: business,
    });
  } catch (error) {
    next(error);
  }
};

export const updateBusinessController = async (
  req: Request<object, object, UpdateBusinessBody>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const business = await updateBusinessService(
      req.user!.idBusiness,
      req.body,
    );

    res.status(200).json({
      status: "OK",
      message: "Negocio actualizado correctamente",
      data: business,
    });
  } catch (error) {
    next(error);
  }
};
