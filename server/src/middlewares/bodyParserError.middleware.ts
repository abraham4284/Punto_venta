import type { NextFunction, Request, Response } from "express";

interface BodyParserError {
  type?: string;
  status?: number;
  statusCode?: number;
  limit?: number;
  length?: number;
  body?: unknown;
}

export function bodyParserErrorMiddleware(
  error: BodyParserError,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (error.type === "entity.too.large" || error.status === 413) {
    res.status(413).json({
      success: false,
      status: "ERROR",
      code: "PAYLOAD_TOO_LARGE",
      message: "El contenido enviado supera el tamano permitido.",
      data: null,
    });
    return;
  }

  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    res.status(400).json({
      success: false,
      status: "ERROR",
      code: "INVALID_JSON_BODY",
      message: "El contenido JSON enviado no es valido.",
      data: null,
    });
    return;
  }

  next(error);
}
