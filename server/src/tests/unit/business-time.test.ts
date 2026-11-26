import { readFileSync } from "node:fs";
import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { businessDateRange, businessDateTimeToDate, businessPeriods, currentBusinessDate, parseBusinessLocalDate } from "@/helpers/business-time.helper.js";
import { businessDateTimeQuery } from "@/helpers/business-datetime-query.helper.js";

const { query } = vi.hoisted(function mocks() { return { query: vi.fn() }; });
vi.mock("@/db/db.js", function database() { return { pool: { query } }; });
vi.mock("@/modules/notifications/services/notifications.service.js", function notifications() {
  return { safeEvaluateStockNotification: vi.fn() };
});
import { getSalesController } from "@/modules/businesses-app/sales/controllers/sales.controller.js";
import { getPurchasesController } from "@/modules/businesses-app/purchases/controllers/purchases.controller.js";
import { getSalesService } from "@/modules/businesses-app/sales/services/sales.service.js";
import { getDashboardDataService } from "@/modules/businesses-app/dashboard/services/dashboard.service.js";

const now = new Date("2026-11-26T01:30:00Z"); // 25 November, 22:30 in Argentina.
const bounds = businessDateRange("2026-11-25", "2026-11-25");
const dataset = [
  { date: "2026-11-24 23:59:00", total: 100000, status: "COMPLETED" },
  { date: "2026-11-25 00:00:00", total: 10000, status: "COMPLETED" },
  { date: "2026-11-25 00:30:00", total: 20000, status: "COMPLETED" },
  { date: "2026-11-25 22:00:00", total: 50000, status: "CANCELLED" },
  { date: "2026-11-26 00:00:00", total: 200000, status: "COMPLETED" },
];
function response() {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res); res.json.mockReturnValue(res);
  return res;
}

beforeEach(function reset() { vi.resetAllMocks(); });

describe("Argentine business calendar", function calendar() {
  it("keeps a LocalDate as a calendar and binds exclusive SQL boundaries", function day() {
    expect(parseBusinessLocalDate("2026-11-25")).toBe("2026-11-25");
    expect(bounds).toEqual({ startDate: "2026-11-25 00:00:00", endDate: "2026-11-26 00:00:00" });
    expect(businessDateRange("2026-11-24", "2026-11-25").startDate).toBe("2026-11-24 00:00:00");
    expect(businessDateRange("2026-11-25", undefined)).toEqual({ startDate: bounds.startDate, endDate: null });
    expect(businessDateRange(undefined, "2026-11-25")).toEqual({ startDate: null, endDate: bounds.endDate });
    expect(businessDateRange("", null)).toEqual({ startDate: null, endDate: null });
  });
  it.each(["2026-02-30", "2026-13-01", "25/11/2026", "2026-11-25T00:00:00Z", " ", ["2026-11-25"]])("rejects invalid date %j", function invalid(value) {
    expect(() => parseBusinessLocalDate(value)).toThrow();
  });
  it("validates leap days and reversed ranges", function leap() {
    expect(businessDateRange("2024-02-29", "2024-02-29").endDate).toBe("2024-03-01 00:00:00");
    expect(() => businessDateRange("2026-11-26", "2026-11-25")).toThrow();
  });
  it.each([
    ["2026-11-24 23:59:00", false],
    ["2026-11-25 00:00:00", true],
    ["2026-11-25 00:30:00", true],
    ["2026-11-25 20:59:00", true],
    ["2026-11-25 21:00:00", true],
    ["2026-11-25 23:59:00", true],
    ["2026-11-26 00:00:00", false],
  ])("classifies commercial time %s without a UTC day shift", function classify(value, included) {
    expect(value >= bounds.startDate! && value < bounds.endDate!).toBe(included);
    expect(currentBusinessDate(businessDateTimeToDate(value))).toBe(value.slice(0, 10));
  });
  it("uses the commercial day/month/year near UTC transitions", function periods() {
    expect(businessPeriods(now)).toEqual({
      todayStart: bounds.startDate, tomorrowStart: bounds.endDate,
      monthStart: "2026-11-01 00:00:00", nextMonthStart: "2026-12-01 00:00:00", currentYear: 2026,
    });
    expect(businessPeriods(new Date("2027-01-01T02:59:59Z"))).toMatchObject({
      todayStart: "2026-12-31 00:00:00", tomorrowStart: "2027-01-01 00:00:00",
      monthStart: "2026-12-01 00:00:00", nextMonthStart: "2027-01-01 00:00:00", currentYear: 2026,
    });
    expect(businessPeriods(new Date("2027-01-01T03:00:00Z"))).toMatchObject({ currentYear: 2027, monthStart: "2027-01-01 00:00:00" });
    expect(businessPeriods(new Date("2026-12-01T03:30:00Z"))).toMatchObject({ monthStart: "2026-12-01 00:00:00", nextMonthStart: "2027-01-01 00:00:00" });
  });
  it("reads storage DATETIME in its declared zone and preserves milliseconds", function reading() {
    expect(businessDateTimeToDate("2026-11-25 00:30:00").toISOString()).toBe("2026-11-25T03:30:00.000Z");
    expect(businessDateTimeToDate("2026-11-25 22:30:00.123456").toISOString()).toBe("2026-11-26T01:30:00.123Z");
    expect(businessDateTimeToDate("2026-11-25 00:30:00", "UTC").toISOString()).toBe("2026-11-25T00:30:00.000Z");
    const options = businessDateTimeQuery("SELECT fixture");
    const cast = options.typeCast;
    if (typeof cast !== "function") throw new Error("Expected local query typeCast");
    const next = vi.fn().mockReturnValue(12);
    const field = { type: "DATETIME", name: "sale_date", table: "s", string: () => "2026-11-25 00:30:00" } as Parameters<typeof cast>[0];
    expect(cast(field, next)).toEqual(new Date("2026-11-25T03:30:00Z"));
    expect(cast({ ...field, string: () => null }, next)).toBeNull();
    expect(cast({ ...field, type: "LONG" }, next)).toBe(12);
    expect(cast({ ...field, name: "scheduled_at" }, next)).toBe(12);
  });
});

describe("Sales and Dashboard forwarding, DB-free", function services() {
  it.each([getSalesController, getPurchasesController])("passes calendar boundaries directly from HTTP without Date coercion", async function http(handler) {
    query.mockResolvedValue([[[], [{ totalRecords: 0 }]]]);
    const res = response();
    await handler({ query: { startDate: "2026-11-25", endDate: "2026-11-25" }, user: { idBusiness: 7 } } as unknown as Request, res as unknown as Response);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(query.mock.calls[0][1].slice(7, 9)).toEqual([bounds.startDate, bounds.endDate]);
  });
  it("rejects invalid HTTP dates before querying", async function invalid() {
    const res = response();
    await getSalesController({ query: { startDate: "2026-02-30" }, user: { idBusiness: 7 } } as unknown as Request, res as unknown as Response);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(query).not.toHaveBeenCalled();
  });
  it("uses the same exclusive day for History, Dashboard sales and purchases after 21:00", async function parity() {
    query.mockImplementation(async function mock(sql: string | { sql: string }, params: unknown[]) {
      const name = typeof sql === "string" ? sql : sql.sql;
      const from = name.includes("sp_get_sales") ? params[7] : params[1];
      const until = name.includes("sp_get_sales") ? params[8] : params[2];
      if (name.includes("sp_get_dashboard_charts")) return [[[], [], [], [], [], []]];
      const matches = dataset.filter(function match(row) { return row.date >= String(from) && row.date < String(until); });
      const completed = matches.filter(function effective(row) { return row.status === "COMPLETED"; });
      const total = completed.reduce(function sum(total, row) { return total + row.total; }, 0);
      if (name.includes("sp_get_dashboard_metrics")) {
        return [[[{ todaySalesTotal: total, todaySalesCount: completed.length, todayPurchasesTotal: total, todayPurchasesCount: completed.length }]]];
      }
      return [[matches.map(function sale(row, index) { return { idSale: index + 1, total: row.total, status: row.status }; }), [{
        totalRecords: matches.length, completedRecords: completed.length, cancelledRecords: matches.length - completed.length, completedTotal: total,
      }]]];
    });
    const history = await getSalesService({ idBusiness: 7, page: 1, limit: 100, offset: 0, ...bounds });
    const dashboard = await getDashboardDataService(7, undefined, now);
    expect(history.metrics).toMatchObject({ total: 3, completed: 2, cancelled: 1, completedTotal: 30000 });
    expect(dashboard.metrics.todaySalesCount).toBe(history.metrics.completed);
    expect(dashboard.metrics.todaySalesTotal).toBe(history.metrics.completedTotal);
    expect(dashboard.metrics.todayPurchasesTotal).toBe(30000);
    expect(query.mock.calls[1][1]).toEqual([7, bounds.startDate, bounds.endDate, "2026-11-01 00:00:00", "2026-12-01 00:00:00"]);
    expect(query).toHaveBeenCalledTimes(3); // No independent purchase fallback clock/query.
  });
  it("defaults the selected year from the same business clock", async function year() {
    query.mockResolvedValue([[[]]]);
    const data = await getDashboardDataService(7, undefined, new Date("2027-01-01T02:30:00Z"));
    expect(data.selectedYear).toBe(2026);
    expect(query.mock.calls[1][1]).toEqual([7, 2026, "2026-12-01 00:00:00", "2027-01-01 00:00:00", 2026]);
  });
  it("keeps row/summary SQL predicates identical and Dashboard ranges independent of the DB clock", function sql() {
    for (const [file, column] of [["sales", "s.sale_date"], ["purchases", "p.purchase_date"]]) {
      const source = readFileSync(new URL(`../../db/procedures/${file}.sql`, import.meta.url), "utf8");
      expect(source.match(new RegExp(column.replace(".", "\\.") + " < p_endDate", "g"))).toHaveLength(2);
      expect(source).not.toContain(column + " <= p_endDate");
    }
    const sql = readFileSync(new URL("../../db/procedures/dashboard.sql", import.meta.url), "utf8");
    expect(sql).not.toMatch(/CURDATE\(|UTC_DATE\(/);
    expect(sql.match(/s.sale_date >= p_todayStart/g)).toHaveLength(2);
    expect(sql.match(/s.sale_date < p_tomorrowStart/g)).toHaveLength(2);
    expect(sql.match(/s.sale_date >= p_monthStart/g)).toHaveLength(3);
    expect(sql.match(/s.sale_date < p_nextMonthStart/g)).toHaveLength(3);
    expect(sql).toContain("s.status = 'COMPLETED'");
    expect(sql).toContain("TIMESTAMPADD(MONTH, months.monthNumber");
    expect(sql).toContain("SELECT p_currentYear AS year");
  });
});
