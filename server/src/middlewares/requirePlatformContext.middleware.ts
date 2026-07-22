import type { NextFunction, Request, Response } from "express";

export function requirePlatformContext(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.auth?.context !== "PLATFORM") {
    res.status(403).json({
      success: false,
      message: "Acceso permitido solo para plataforma",
      data: null,
    });
    return;
  }

  next();
}
