import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "@/libs/tokens.js";

function isPlatformRoute(req: Request): boolean {
  return req.originalUrl.startsWith("/api/platform");
}

function getBearerToken(authHeader: string | undefined): string | undefined {
  if (!authHeader) return undefined;

  const [scheme, jwtToken] = authHeader.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !jwtToken) {
    return undefined;
  }

  return jwtToken;
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const cookieToken = req.cookies?.access_token as string | undefined;
  const authHeader = req.headers.authorization;
  const platformRoute = isPlatformRoute(req);
  const token = platformRoute
    ? cookieToken ?? getBearerToken(authHeader)
    : cookieToken;

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
      if (!platformRoute) {
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

    if (platformRoute) {
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
