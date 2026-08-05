import request from "supertest";
import { describe, expect, it } from "vitest";
import { getTestApp } from "@/tests/helpers/test-app.helper.js";

describe("Helmet", function helmetSuite() {
  it("agrega headers de seguridad a una respuesta valida", async function testHelmetHeaders() {
    const response = await request(getTestApp()).get("/");

    expect(response.status).toBe(200);
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["x-frame-options"]).toBeDefined();
    expect(response.headers["referrer-policy"]).toBeDefined();
  });
});
