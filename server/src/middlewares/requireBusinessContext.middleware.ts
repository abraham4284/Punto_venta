import type { NextFunction, Request, Response } from "express";

export function requireBusinessContext(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.auth?.context !== "BUSINESS" || !req.user) {
    res.status(403).json({
      success: false,
      message: "Acceso permitido solo para negocios",
      data: null,
    });
    return;
  }

  next();
}
