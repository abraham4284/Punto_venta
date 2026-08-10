import request from "supertest";
import { describe, expect, it } from "vitest";
import { getTestApp } from "@/tests/helpers/test-app.helper.js";
import { expectErrorResponse } from "@/tests/helpers/test-response.helper.js";

describe("Rate limit general", function globalRateLimitSuite() {
  it("permite solicitudes normales antes de alcanzar el limite", async function testNormalRequestsBeforeLimit() {
    const app = getTestApp();

    const firstResponse = await request(app).get("/api/global-rate-limit-check");
    const secondResponse = await request(app).get("/api/global-rate-limit-check");
    const thirdResponse = await request(app).get("/api/global-rate-limit-check");

    expect(firstResponse.status).not.toBe(429);
    expect(secondResponse.status).not.toBe(429);
    expect(thirdResponse.status).not.toBe(429);
  });

  it("limita solicitudes generales a /api", async function testGlobalRateLimit() {
    const app = getTestApp();

    await request(app).get("/api/global-rate-limit-check");
    await request(app).get("/api/global-rate-limit-check");
    await request(app).get("/api/global-rate-limit-check");
    const response = await request(app).get("/api/global-rate-limit-check");

    expectErrorResponse(response, {
      status: 429,
      code: "RATE_LIMIT_EXCEEDED",
    });
    expect(
      response.headers["ratelimit-limit"] ??
        response.headers["x-ratelimit-limit"] ??
        response.headers["ratelimit-policy"],
    ).toBeDefined();
  });

  it("no cuenta preflight OPTIONS contra el limite global", async function testOptionsDoesNotConsumeGlobalLimit() {
    const app = getTestApp();

    await request(app)
      .options("/api/global-rate-limit-check")
      .set("Origin", "http://localhost:5173")
      .set("Access-Control-Request-Method", "GET");
    await request(app)
      .options("/api/global-rate-limit-check")
      .set("Origin", "http://localhost:5173")
      .set("Access-Control-Request-Method", "GET");
    await request(app)
      .options("/api/global-rate-limit-check")
      .set("Origin", "http://localhost:5173")
      .set("Access-Control-Request-Method", "GET");

    const response = await request(app).get("/api/global-rate-limit-check");

    expect(response.status).not.toBe(429);
  });
});
