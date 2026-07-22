import type { Request, Response, NextFunction } from "express";
import {
  createProductCategoryService,
  getProductCategoriesService,
  getProductCategoryByIdService,
  updateProductCategoryService,
  updateProductCategoryStatusService,
} from "../services/product-category.service.js";
import type {
  CreateProductCategoryBody,
  UpdateProductCategoryBody,
  UpdateProductCategoryStatusBody,
} from "../types/product-category.types.js";

export async function createProductCategoryController(
  req: Request<object, object, CreateProductCategoryBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const productCategory = await createProductCategoryService(
      req.user!.idBusiness,
      req.body,
    );

    res.status(201).json({
      status: "OK",
      message: "Categoria creada correctamente",
      data: productCategory,
    });
  } catch (error) {
    next(error);
  }
}

export async function getProductCategoriesController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const productCategories = await getProductCategoriesService(
      req.user!.idBusiness,
    );

    res.status(200).json({
      status: "OK",
      message: "Categorias obtenidas correctamente",
      data: productCategories,
    });
  } catch (error) {
    next(error);
  }
}

export async function getProductCategoryByIdController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const productCategory = await getProductCategoryByIdService(
      req.user!.idBusiness,
      Number(req.params.idProductCategory),
    );

    res.status(200).json({
      status: "OK",
      message: "Categoria obtenida correctamente",
      data: productCategory,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProductCategoryController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const productCategory = await updateProductCategoryService(
      req.user!.idBusiness,
      Number(req.params.idProductCategory),
      req.body,
    );

    res.status(200).json({
      status: "OK",
      message: "Categoria actualizada correctamente",
      data: productCategory,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProductCategoryStatusController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const productCategory = await updateProductCategoryStatusService(
      req.user!.idBusiness,
      Number(req.params.idProductCategory),
      req.body.isActive,
    );

    res.status(200).json({
      status: "OK",
      message: "Estado de categoria actualizado correctamente",
      data: productCategory,
    });
  } catch (error) {
    next(error);
  }
}
