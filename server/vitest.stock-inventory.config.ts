import { defineConfig } from "vitest/config";
import base from "./vitest.stock-transfer.config.js";

export default defineConfig({
  ...base,
  test: {
    ...base.test,
    include: [...base.test.include, "src/tests/unit/stock-inventory.test.ts"],
  },
});
