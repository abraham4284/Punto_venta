import express, { type NextFunction, type Request, type Response } from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import {
  importRateLimiter,
  passwordResetRateLimiter,
} from "@/middlewares/rate-limit/rate-limit.middleware.js";
import { expectErrorResponse } from "@/tests/helpers/test-response.helper.js";

function attachPlatformActor(req: Request, _res: Response, next: NextFunction): void {
  req.auth = {
    context: "PLATFORM",
    idUser: 10,
    platformRole: "SUPER_ADMIN",
  };
  next();
}

function attachBusinessUser(req: Request, _res: Response, next: NextFunction): void {
  req.auth = {
    context: "BUSINESS",
    idBusiness: 20,
    idUser: 30,
    businessRole: "OWNER",
  };
  req.user = {
    idBusiness: 20,
    idUser: 30,
    role: "OWNER",
  };
  next();
}

function createSpecificLimiterTestApp() {
  const app = express();

  app.post(
    "/password-reset",
    attachPlatformActor,
    passwordResetRateLimiter,
    (_req, res) => {
      res.status(200).json({ status: true });
    },
  );
  app.post("/import", attachBusinessUser, importRateLimiter, (_req, res) => {
    res.status(200).json({ status: true });
  });

  return app;
}

describe("Rate limiters especificos", function specificRateLimitSuite() {
  it("limita reset administrativo de passwords por actor e IP", async function testPasswordResetLimit() {
    const app = createSpecificLimiterTestApp();

    await request(app).post("/password-reset");
    await request(app).post("/password-reset");
    const limitedResponse = await request(app).post("/password-reset");

    expectErrorResponse(limitedResponse, {
      status: 429,
      code: "RATE_LIMIT_EXCEEDED",
    });
  });

  it("limita importaciones por negocio y usuario autenticado", async function testImportLimit() {
    const app = createSpecificLimiterTestApp();

    await request(app).post("/import");
    await request(app).post("/import");
    const limitedResponse = await request(app).post("/import");

    expectErrorResponse(limitedResponse, {
      status: 429,
      code: "RATE_LIMIT_EXCEEDED",
    });
  });
});
