import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";
import { ZodError } from "zod";

function formatZodErrors(error: ZodError) {
  return error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
    code: issue.code,
  }));
}

export function validateBody(schema: ZodSchema) {
  return function validateBodyMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          status: "ERROR",
          message: "Errores de validacion",
          errors: formatZodErrors(error),
        });
        return;
      }

      next(error);
    }
  };
}

export function validateParams(schema: ZodSchema) {
  return function validateParamsMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    try {
      req.params = schema.parse(req.params) as typeof req.params;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          status: "ERROR",
          message: "Errores de validacion",
          errors: formatZodErrors(error),
        });
        return;
      }

      next(error);
    }
  };
}
