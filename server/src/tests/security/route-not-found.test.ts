import request from "supertest";
import { describe, expect, it } from "vitest";
import { getTestApp } from "@/tests/helpers/test-app.helper.js";
import { expectErrorResponse } from "@/tests/helpers/test-response.helper.js";

describe("Rutas inexistentes", function routeNotFoundSuite() {
  it("devuelve JSON uniforme para una ruta API inexistente", async function testRouteNotFound() {
    const response = await request(getTestApp()).get(
      "/api/platform/security-test-route-not-found",
    );

    expectErrorResponse(response, {
      status: 404,
      code: "ROUTE_NOT_FOUND",
    });
    expect(response.body.message).toBe("La ruta solicitada no existe.");
    expect(response.body.data).toBeNull();
  });
});
