// DATETIME storage uses the Argentine wall clock, confirmed by the operator.
export const BUSINESS_TIME_ZONE = "America/Argentina/Tucuman";
const calendarOptions: Intl.DateTimeFormatOptions = {
  year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
};
const businessCalendarFormatter = new Intl.DateTimeFormat("en-CA", {
  ...calendarOptions, timeZone: BUSINESS_TIME_ZONE,
});

export function parseBusinessLocalDate(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("La fecha debe tener formato YYYY-MM-DD");
  }
  const date = new Date(value + "T00:00:00Z");
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value ||
      Number(value.slice(0, 4)) < 1000) {
    throw new Error("La fecha calendario no es válida");
  }
  return value;
}

export function nextBusinessDate(date: string): string {
  const calendar = new Date(date + "T00:00:00Z");
  calendar.setUTCDate(calendar.getUTCDate() + 1);
  const next = calendar.toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(next)) throw new Error("La fecha excede el rango permitido");
  return next;
}

export function businessDateRange(start: unknown, end: unknown): { startDate: string | null; endDate: string | null } {
  const from = parseBusinessLocalDate(start);
  const through = parseBusinessLocalDate(end);
  if (from && through && from > through) throw new Error("La fecha desde no puede ser posterior a la fecha hasta");
  return {
    startDate: from ? from + " 00:00:00" : null,
    endDate: through ? nextBusinessDate(through) + " 00:00:00" : null,
  };
}

function calendarParts(now: Date, timeZone: string) {
  const formatter = timeZone === BUSINESS_TIME_ZONE ? businessCalendarFormatter :
    new Intl.DateTimeFormat("en-CA", { ...calendarOptions, timeZone });
  const parts = formatter.formatToParts(now);
  return Object.fromEntries(parts.map(function part(part) { return [part.type, part.value]; }));
}

export function currentBusinessDate(now: Date, timeZone = BUSINESS_TIME_ZONE): string {
  const parts = calendarParts(now, timeZone);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function businessPeriods(now: Date, timeZone = BUSINESS_TIME_ZONE) {
  const date = currentBusinessDate(now, timeZone);
  const monthStart = date.slice(0, 7) + "-01";
  const nextMonth = new Date(monthStart + "T00:00:00Z");
  nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
  return {
    todayStart: date + " 00:00:00",
    tomorrowStart: nextBusinessDate(date) + " 00:00:00",
    monthStart: monthStart + " 00:00:00",
    nextMonthStart: nextMonth.toISOString().slice(0, 10) + " 00:00:00",
    currentYear: Number(date.slice(0, 4)),
  };
}

export function businessDateTimeToDate(value: string, timeZone = BUSINESS_TIME_ZONE): Date {
  if (!/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(\.\d{1,6})?$/.test(value)) {
    throw new Error("La fecha de negocio no es válida");
  }
  const wallClock = Date.parse(value.replace(" ", "T") + "Z");
  const wallSecond = Math.floor(wallClock / 1000) * 1000;
  let instant = wallClock;
  for (let attempt = 0; attempt < 3; attempt++) {
    const parts = calendarParts(new Date(instant), timeZone);
    const rendered = Date.parse(`${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}Z`);
    const correction = wallSecond - rendered;
    if (correction === 0) return new Date(instant);
    instant += correction;
  }
  throw new Error("La fecha no existe en el calendario comercial");
}
