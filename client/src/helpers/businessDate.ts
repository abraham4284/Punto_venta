export const BUSINESS_TIME_ZONE = "America/Argentina/Tucuman";

export const formatBusinessDate = (value: Date | string): string =>
  new Intl.DateTimeFormat("es-AR", {
    timeZone: BUSINESS_TIME_ZONE,
    hourCycle: "h23",
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(value));

export const currentBusinessCalendar = (now = new Date()) => {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: BUSINESS_TIME_ZONE, year: "numeric", month: "2-digit",
  }).formatToParts(now);
  return {
    year: Number(parts.find((part) => part.type === "year")?.value),
    month: Number(parts.find((part) => part.type === "month")?.value),
  };
};

export const currentBusinessYear = (now = new Date()): number => currentBusinessCalendar(now).year;
