import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "@/db/db.js";

export function validateTestDatabaseEnvironment(): void {
  const dbName = process.env.DB_NAME;

  if (!dbName?.endsWith("_test")) {
    throw new Error(
      "Los tests solamente pueden ejecutarse contra una base cuyo nombre termine en _test",
    );
  }

  if (dbName !== "punto_venta_integration_test") {
    throw new Error(
      "DB_NAME debe ser punto_venta_integration_test para esta suite inicial",
    );
  }
}

export function assertIntegrationTestDatabaseSafety(): void {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("La limpieza de datos solo puede ejecutarse con NODE_ENV=test");
  }

  validateTestDatabaseEnvironment();
}

export async function resetIntegrationTestData(): Promise<void> {
  assertIntegrationTestDatabaseSafety();

  await pool.query("SET FOREIGN_KEY_CHECKS = 0");

  try {
    const tables = [
      "notification_recipients",
      "notifications",
      "legal_acceptances",
      "legal_document_versions",
      "legal_documents",
      "cash_session_payment_summaries",
      "cash_movements",
      "sale_details",
      "sales",
      "purchase_details",
      "purchases",
      "stock_movements",
      "stock",
      "products",
      "product_categories",
      "cash_sessions",
      "cash_registers",
      "payment_methods",
      "deposits",
      "customers",
      "suppliers",
      "business_user_permissions",
      "business_users",
      "subscription_events",
      "subscription_payments",
      "business_subscriptions",
      "user_sessions",
      "platform_audit_logs",
      "platform_users",
      "businesses",
      "users",
    ];
    const [existingRows] = await pool.query<RowDataPacket[]>(
      `SELECT TABLE_NAME AS tableName
         FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME IN (?)`,
      [tables],
    );
    const existingTables = new Set(
      existingRows.map(function mapTable(row) {
        return String(row.tableName);
      }),
    );

    for (const table of tables) {
      if (!existingTables.has(table)) {
        continue;
      }

      await pool.query(`DELETE FROM \`${table}\``);
    }
  } finally {
    await pool.query("SET FOREIGN_KEY_CHECKS = 1");
  }
}

export async function querySingleRow<T extends RowDataPacket>(
  sql: string,
  values: unknown[] = [],
): Promise<T | null> {
  const [rows] = await pool.query<T[]>(sql, values);
  return rows[0] ?? null;
}

export async function executeInsert(
  sql: string,
  values: unknown[] = [],
): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(sql, values);
  return result.insertId;
}

export async function executeMutation(
  sql: string,
  values: unknown[] = [],
): Promise<ResultSetHeader> {
  const [result] = await pool.query<ResultSetHeader>(sql, values);
  return result;
}
