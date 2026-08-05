import { existsSync } from "node:fs";
import { resolve } from "node:path";
import dotenv from "dotenv";
import { afterAll, beforeEach } from "vitest";
import { validateTestDatabaseEnvironment } from "@/tests/helpers/test-database.helper.js";

const envTestPath = resolve(process.cwd(), ".env.test");
const hasEnvTestFile = existsSync(envTestPath);

if (hasEnvTestFile) {
  dotenv.config({ path: envTestPath, quiet: true });
}

process.env.NODE_ENV = "test";

if (!hasEnvTestFile) {
  process.env.DB_NAME = "punto_venta_integration_test";
}

process.env.FRONTEND_URL ??= "http://localhost:5173";
process.env.FRONTEND_URL_LOCAL ??= "http://localhost:5173";
process.env.ACCESS_TOKEN_SECRET ??= "test_access_secret_change_me";
process.env.REFRESH_TOKEN_SECRET ??= "test_refresh_secret_change_me";
process.env.TRUST_PROXY_HOPS ??= "0";
process.env.JSON_BODY_LIMIT ??= "1kb";
process.env.URL_ENCODED_BODY_LIMIT ??= "1kb";
process.env.UPLOAD_MAX_FILE_SIZE_MB ??= "1";
process.env.IMPORT_MAX_ROWS ??= "3";
process.env.IMPORT_MAX_COLUMNS ??= "10";
process.env.IMPORT_MAX_CELL_LENGTH ??= "100";
process.env.GLOBAL_RATE_LIMIT_WINDOW_MS ??= "60000";
process.env.GLOBAL_RATE_LIMIT_MAX ??= "3";
process.env.BUSINESS_LOGIN_RATE_LIMIT_WINDOW_MS ??= "60000";
process.env.BUSINESS_LOGIN_RATE_LIMIT_MAX ??= "2";
process.env.PLATFORM_LOGIN_RATE_LIMIT_WINDOW_MS ??= "60000";
process.env.PLATFORM_LOGIN_RATE_LIMIT_MAX ??= "2";
process.env.REGISTER_RATE_LIMIT_WINDOW_MS ??= "60000";
process.env.REGISTER_RATE_LIMIT_MAX ??= "2";
process.env.REFRESH_RATE_LIMIT_WINDOW_MS ??= "60000";
process.env.REFRESH_RATE_LIMIT_MAX ??= "3";
process.env.PASSWORD_RESET_RATE_LIMIT_WINDOW_MS ??= "60000";
process.env.PASSWORD_RESET_RATE_LIMIT_MAX ??= "2";
process.env.IMPORT_RATE_LIMIT_WINDOW_MS ??= "60000";
process.env.IMPORT_RATE_LIMIT_MAX ??= "2";

validateTestDatabaseEnvironment();

beforeEach(async function resetSecurityState() {
  const { resetRateLimitStoresForTests } = await import(
    "@/middlewares/rate-limit/rate-limit.middleware.js"
  );

  await resetRateLimitStoresForTests();
});

afterAll(async function closeDatabasePool() {
  const { pool } = await import("@/db/db.js");

  await pool.end();
});
