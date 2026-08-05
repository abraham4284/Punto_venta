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
