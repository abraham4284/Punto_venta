import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "@/libs/tokens.js";

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const cookieToken = req.cookies?.access_token as string | undefined;
  console.log(cookieToken, "Token del middleware");
  console.log(req.cookies, "Cookies del middleware");
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
    req.user = verifyAccessToken(token);
    next();
  } catch {
    res.status(401).json({
      status: "ERROR",
      message: "Token invalido o expirado",
    });
  }
};
