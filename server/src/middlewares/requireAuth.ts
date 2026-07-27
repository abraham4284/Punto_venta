import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "@/libs/tokens.js";

function isPlatformRoute(req: Request): boolean {
  return req.originalUrl.startsWith("/api/platform");
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const cookieToken = req.cookies?.access_token as string | undefined;
  const authHeader = req.headers.authorization;
  let token = cookieToken;

  if (!token && authHeader) {
    const [scheme, jwtToken] = authHeader.split(" ");

    if (scheme?.toLowerCase() === "bearer" && jwtToken) {
      token = jwtToken;
    }
  }

  if (!token) {
    res.status(401).json({
      status: "ERROR",
      message: "No autorizado",
    });
    return;
  }

  try {
    const payload = verifyAccessToken(token);

    if (payload.context === "PLATFORM") {
      if (!isPlatformRoute(req)) {
        res.status(403).json({
          status: "ERROR",
          message: "Token de plataforma no autorizado para esta ruta",
        });
        return;
      }

      req.auth = payload;
      next();
      return;
    }

    if (isPlatformRoute(req)) {
      res.status(403).json({
        status: "ERROR",
        message: "Token comercial no autorizado para plataforma",
      });
      return;
    }

    req.auth = payload;
    req.user = {
      idUser: payload.idUser,
      idBusiness: payload.idBusiness,
      role: payload.businessRole,
    };
    next();
  } catch {
    res.status(401).json({
      status: "ERROR",
      message: "Token invalido o expirado",
    });
  }
}
