import type { QueryOptions } from "mysql2";
import { businessDateTimeToDate } from "./business-time.helper.js";

const businessDates = new Set(["sale_date", "saleDate", "purchase_date", "purchaseDate"]);
const headerDates = new Set(["created_at", "createdAt", "updated_at", "updatedAt"]);
const headerTables = new Set(["s", "p", "sales", "purchases"]);

// Opt in only on the affected read queries, without changing the pool or writes.
export function businessDateTimeQuery(sql: string): QueryOptions {
  return {
    sql,
    typeCast(field, next) {
      const isHeaderDate = businessDates.has(field.name) ||
        (headerDates.has(field.name) && headerTables.has(field.table));
      if (field.type !== "DATETIME" || !isHeaderDate) return next();
      const value = field.string();
      return value === null ? null : businessDateTimeToDate(value);
    },
  };
}
