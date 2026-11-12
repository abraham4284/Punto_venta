import { defineConfig } from "vitest/config";
import base from "./vitest.orders-integration.config.js";

// Requires operator authorization and the canonical stock_movements.sql installed.
export default defineConfig({
  ...base,
  test: { ...base.test, include: ["src/tests/integration/stock-transfer/*.test.ts"] },
});
