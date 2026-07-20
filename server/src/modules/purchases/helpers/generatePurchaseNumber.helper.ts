import { randomBytes } from "node:crypto";

const SAFE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function padTwoDigits(value: number): string {
  return String(value).padStart(2, "0");
}

function formatCurrentDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = padTwoDigits(now.getMonth() + 1);
  const day = padTwoDigits(now.getDate());

  return `${year}${month}${day}`;
}

function generateShortCode(): string {
  const randomValues = randomBytes(6);
  let code = "";

  for (const value of randomValues) {
    code += SAFE_ALPHABET[value % SAFE_ALPHABET.length];
  }

  return code;
}

export function generatePurchaseNumber(): string {
  return `CMP-${formatCurrentDate()}-${generateShortCode()}`;
}
