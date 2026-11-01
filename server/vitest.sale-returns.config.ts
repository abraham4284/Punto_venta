import { defineConfig } from "vitest/config";
import base from "./vitest.delivery-providers.config.js";
export default defineConfig({ ...base, test: { ...base.test, include: [...base.test!.include!, "src/tests/unit/sale-returns*.test.ts"] } });
