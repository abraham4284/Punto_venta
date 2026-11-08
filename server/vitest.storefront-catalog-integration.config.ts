import { defineConfig } from "vitest/config";
import base from "./vitest.orders-integration.config.js";

// Operator authorization required. Never installs SQL; inherits loopback/exact test DB guards.
export default defineConfig({
  ...base,
  test: { ...base.test, include: ["src/tests/integration/storefront-catalog/*.test.ts"] },
});
