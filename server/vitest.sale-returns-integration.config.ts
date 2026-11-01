import { defineConfig } from "vitest/config";
import base from "./vitest.orders-integration.config.js";
// Operator must apply F8 SQL and authorize a real DB gate before execution.
export default defineConfig({ ...base, test: { ...base.test, include: ["src/tests/integration/sale-returns/*.test.ts"] } });
