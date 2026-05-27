import { createPool } from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const DB_HOST = process.env.DB_HOST;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME;
const DB_PORT = Number(process.env.DB_PORT || 3306);

if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME) {
  throw new Error("Faltan variables de entorno de conexión a MySQL");
}

export const pool = createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
  connectTimeout: 10000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

(async (): Promise<void> => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ DB conectada correctamente a MySQL");
    connection.release();
  } catch (error) {
    console.error("❌ Error real de conexión a MySQL:", error);
  }
})();