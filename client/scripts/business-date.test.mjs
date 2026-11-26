import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import test from "node:test";
import ts from "typescript";

const file = new URL("../src/helpers/businessDate.ts", import.meta.url);
const { outputText } = ts.transpileModule(readFileSync(file, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const moduleUrl = "data:text/javascript;base64," + Buffer.from(outputText).toString("base64");
const { formatBusinessDate, currentBusinessYear, currentBusinessCalendar } = await import(moduleUrl);

for (const [instant, display] of [
  ["2026-11-25T02:59:00Z", "24/11/2026, 23:59"],
  ["2026-11-25T03:00:00Z", "25/11/2026, 00:00"],
  ["2026-11-25T03:30:00Z", "25/11/2026, 00:30"],
  ["2026-11-25T23:59:00Z", "25/11/2026, 20:59"],
  ["2026-11-26T00:00:00Z", "25/11/2026, 21:00"],
  ["2026-11-26T02:59:00Z", "25/11/2026, 23:59"],
  ["2026-11-26T03:00:00Z", "26/11/2026, 00:00"],
]) {
  test(`displays Argentine business time for ${instant}`, () => {
    assert.equal(formatBusinessDate(instant), display);
    assert.equal(formatBusinessDate(new Date(instant)), display);
  });
}
test("defaults the commercial year at the UTC year boundary", () => {
  assert.equal(currentBusinessYear(new Date("2027-01-01T02:30:00Z")), 2026);
  assert.equal(currentBusinessYear(new Date("2027-01-01T03:00:00Z")), 2027);
  assert.deepEqual(currentBusinessCalendar(new Date("2027-01-01T02:30:00Z")), { year: 2026, month: 12 });
});
for (const tz of ["UTC", "America/Argentina/Tucuman", "Asia/Tokyo"]) {
  test(`display is independent of process/browser timezone ${tz}`, () => {
    const code = `const h=await import(${JSON.stringify(moduleUrl)}); process.stdout.write(h.formatBusinessDate("2026-11-25T03:30:00Z"));`;
    const result = spawnSync(process.execPath, ["--input-type=module", "-e", code], {
      env: { ...process.env, TZ: tz }, encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, "25/11/2026, 00:30");
  });
}
