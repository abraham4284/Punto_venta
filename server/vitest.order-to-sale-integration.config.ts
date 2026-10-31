import { defineConfig } from "vitest/config";
import orders from "./vitest.orders-integration.config.js";

// Same loopback/exact-test-DB guards, setup and limits as the existing Orders suite.
// Operator applies F5 SQL first. This config is not part of the DB-free commands.
export default defineConfig({
  ...orders,
  test: { ...orders.test, include: ["src/tests/integration/orders/order-to-sale.integration.test.ts"] },
});
