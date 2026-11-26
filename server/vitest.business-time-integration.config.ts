import { defineConfig } from "vitest/config";
import base from "./vitest.orders-integration.config.js";

// Prepared only. Requires operator authorization and current Sales/Purchases/Dashboard SQL.
export default defineConfig({
  ...base,
  test: { ...base.test, include: ["src/tests/integration/business-time/*.test.ts"] },
});
