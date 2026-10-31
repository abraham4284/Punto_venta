import { defineConfig } from "vitest/config";
import base from "./vitest.orders-integration.config.js";
// Future operator-authorized run after F7 SQL. Exact test DB + loopback guards are inherited.
export default defineConfig({ ...base, test: { ...base.test, include: ["src/tests/integration/delivery-providers/*.test.ts"] } });
