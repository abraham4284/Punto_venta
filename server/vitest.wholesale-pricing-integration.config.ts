import { defineConfig } from "vitest/config";
import base from "./vitest.orders-integration.config.js";

// Requires operator authorization and manual/007 + all four updated procedure files first.
// Inherits loopback, exact test database, test secrets and fixture-only cleanup policy.
export default defineConfig({ ...base, test: { ...base.test,
  include: ["src/tests/integration/wholesale-pricing/*.test.ts"],
} });
