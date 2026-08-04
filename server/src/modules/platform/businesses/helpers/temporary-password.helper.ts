import { randomInt } from "node:crypto";

const UPPERCASE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWERCASE_CHARS = "abcdefghijkmnopqrstuvwxyz";
const NUMBER_CHARS = "23456789";
const SYMBOL_CHARS = "@#$%*?";
const ALL_CHARS = `${UPPERCASE_CHARS}${LOWERCASE_CHARS}${NUMBER_CHARS}${SYMBOL_CHARS}`;

function getSecureCharacter(chars: string): string {
  return chars[randomInt(0, chars.length)];
}

function shuffleSecurely(chars: string[]): string[] {
  const shuffled = [...chars];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = randomInt(0, index + 1);
    const current = shuffled[index];
    shuffled[index] = shuffled[randomIndex];
    shuffled[randomIndex] = current;
  }

  return shuffled;
}

export function generateTemporaryPassword(length = 14): string {
  const normalizedLength = Math.max(length, 12);
  const requiredChars = [
    getSecureCharacter(UPPERCASE_CHARS),
    getSecureCharacter(LOWERCASE_CHARS),
    getSecureCharacter(NUMBER_CHARS),
    getSecureCharacter(SYMBOL_CHARS),
  ];

  while (requiredChars.length < normalizedLength) {
    requiredChars.push(getSecureCharacter(ALL_CHARS));
  }

  return shuffleSecurely(requiredChars).join("");
}
