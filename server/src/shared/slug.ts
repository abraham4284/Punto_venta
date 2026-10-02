export const MAX_SLUG_LENGTH = 180;

export interface ResolveUniqueSlugOptions {
  maxAttempts?: number;
  maxLength?: number;
}

export interface SlugExistsChecker {
  (slug: string): Promise<boolean>;
}

export function normalizeSlugBase(value: string, fallback = "item"): string {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || fallback;
}

export function buildSlugCandidate(
  slugBase: string,
  attempt: number,
  maxLength = MAX_SLUG_LENGTH,
): string {
  if (attempt <= 1) {
    return slugBase.slice(0, maxLength);
  }

  const suffix = `-${attempt}`;
  const baseMaxLength = Math.max(1, maxLength - suffix.length);

  return `${slugBase.slice(0, baseMaxLength).replace(/-+$/g, "")}${suffix}`;
}

export async function resolveUniqueSlug(
  value: string,
  exists: SlugExistsChecker,
  options: ResolveUniqueSlugOptions = {},
): Promise<string> {
  const maxAttempts = options.maxAttempts ?? 50;
  const maxLength = options.maxLength ?? MAX_SLUG_LENGTH;
  const slugBase = normalizeSlugBase(value).slice(0, maxLength);

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const candidate = buildSlugCandidate(slugBase, attempt, maxLength);
    const candidateExists = await exists(candidate);

    if (!candidateExists) {
      return candidate;
    }
  }

  throw new Error("SLUG_GENERATION_ATTEMPTS_EXCEEDED");
}
