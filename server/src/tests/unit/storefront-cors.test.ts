import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Keep the real app and security middleware. Stub routes and DB-dependent imports.
vi.mock("dotenv", function dotenv() {
  return { default: { config: vi.fn() } };
});
vi.mock("@/modules/index.js", async function routes() {
  const { Router } = await import("express");
  const businessesAppRoutes = Router();
  businessesAppRoutes.post("/cors-test", (_req, res) => res.sendStatus(204));
  return { businessesAppRoutes, platformRoutes: Router(), storefrontAppRoutes: Router() };
});
vi.mock("@/modules/businesses-app/subscription/services/subscription-limits.service.js", function limits() {
  return {
    createLimitErrorFromSqlMessage: () => null,
    isSubscriptionResourceLimitError: () => false,
  };
});
vi.mock("@/middlewares/rate-limit/rate-limit.middleware.js", function rateLimit() {
  return { globalApiRateLimiter: (_req: unknown, _res: unknown, next: () => void) => next() };
});
vi.mock("@/db/db.js", function rejectDatabaseImport() {
  throw new Error("CORS tests must not import the database");
});

const render = "https://vitruno.onrender.com";
const railway = "https://vitruno-production.up.railway.app";
const custom = "https://vitruno.com.ar";

beforeEach(function isolateConfiguration() {
  vi.resetModules();
  for (const name of ["FRONTEND_URL", "FRONTEND_URL_LOCAL", "STOREFRONT_URL", "STOREFRONT_URLS"]) {
    vi.stubEnv(name, undefined);
  }
});
afterEach(function restoreEnvironment() {
  vi.unstubAllEnvs();
});

async function readOrigins() {
  return (await import("@/config/security.config.js")).securityConfig.frontendOrigins;
}

describe("storefront origin configuration", function configuration() {
  it("keeps all three legacy variables", async function legacy() {
    vi.stubEnv("FRONTEND_URL", "https://app.example.com");
    vi.stubEnv("FRONTEND_URL_LOCAL", "http://localhost:5173");
    vi.stubEnv("STOREFRONT_URL", render);
    expect(await readOrigins()).toEqual(["https://app.example.com", "http://localhost:5173", render]);
  });

  it("accepts a single origin", async function single() {
    vi.stubEnv("STOREFRONT_URLS", railway);
    expect(await readOrigins()).toEqual([railway]);
  });

  it("trims comma-separated values, ignores empty entries and deduplicates across variables", async function multiple() {
    vi.stubEnv("FRONTEND_URL", custom);
    vi.stubEnv("STOREFRONT_URL", render);
    vi.stubEnv("STOREFRONT_URLS", ` , ${render}, ${railway}, , ${custom}, ${railway}, `);
    expect(await readOrigins()).toEqual([custom, render, railway]);
  });

  it.each(["not-a-url", "*", "*.railway.app", "*.onrender.com", "https://*.railway.app", "https://*.onrender.com",
    "ftp://vitruno.com.ar", "https://vitruno.com.ar/catalog", "https://vitruno.com.ar?query=1",
    "https://user:password@vitruno.com.ar", "https://vitruno.com.ar/"])(
    "fails at configuration load for %s", async function invalid(value) {
      vi.stubEnv("STOREFRONT_URLS", `${custom},${value}`);
      await expect(readOrigins()).rejects.toThrow("STOREFRONT_URLS");
    },
  );
});

async function migrationApp() {
  vi.stubEnv("STOREFRONT_URL", render);
  vi.stubEnv("STOREFRONT_URLS", `${railway},${custom}`);
  return (await import("@/app.js")).default;
}

describe("Express CORS allowlist", function cors() {
  it.each([render, railway, custom])("accepts the exact origin %s with credentials", async function allowed(origin) {
    const response = await request(await migrationApp()).options("/api/public/catalog/products")
      .set("Origin", origin).set("Access-Control-Request-Method", "GET");
    expect(response.status).toBe(204);
    expect(response.headers["access-control-allow-origin"]).toBe(origin);
    expect(response.headers["access-control-allow-credentials"]).toBe("true");
  });

  it.each(["https://sitio-no-autorizado.example", "https://otro.up.railway.app", "https://otro.onrender.com",
    "https://vitruno.com.ar.example.com", "http://vitruno.com.ar", "null"])(
    "omits CORS authorization headers for %s", async function denied(origin) {
      const response = await request(await migrationApp()).get("/").set("Origin", origin);
      expect(response.status).toBe(200);
      expect(response.headers["access-control-allow-origin"]).toBeUndefined();
      expect(response.headers["access-control-allow-credentials"]).toBeUndefined();
    },
  );

  it("keeps requests without Origin available", async function noOrigin() {
    const response = await request(await migrationApp()).get("/");
    expect(response.status).toBe(200);
    expect(response.text).toBe("Api funcionando");
    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("still requires the CSRF header on mutations from a configured storefront", async function csrf() {
    const app = await migrationApp();
    await request(app).post("/api/cors-test").set("Origin", railway).expect(403);
    await request(app).post("/api/cors-test").set("Origin", railway)
      .set("X-CSRF-Protection", "1").expect(204);
  });
});
