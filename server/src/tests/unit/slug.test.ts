import { describe, expect, it } from "vitest";
import {
  buildSlugCandidate,
  normalizeSlugBase,
  resolveUniqueSlug,
} from "@/shared/slug.js";

describe("slug helper", function slugHelperSuite() {
  it("normalizes names into stable public slugs", function testNormalize() {
    expect(normalizeSlugBase("iPhone 13 128GB")).toBe("iphone-13-128gb");
    expect(normalizeSlugBase("Perfume Árabe 100 ml!")).toBe("perfume-arabe-100-ml");
    expect(normalizeSlugBase("  Café --- Molido   Premium  ")).toBe("cafe-molido-premium");
    expect(normalizeSlugBase("###")).toBe("item");
  });

  it("builds suffix candidates without exceeding max length", function testCandidate() {
    expect(buildSlugCandidate("iphone-13-128gb", 1)).toBe("iphone-13-128gb");
    expect(buildSlugCandidate("iphone-13-128gb", 2)).toBe("iphone-13-128gb-2");
    expect(buildSlugCandidate("producto-largo", 12, 12)).toBe("producto-12");
  });

  it("resolves collisions with numeric suffixes", async function testResolveUnique() {
    const existing = new Set(["iphone-13-128gb", "iphone-13-128gb-2"]);
    const slug = await resolveUniqueSlug(
      "iPhone 13 128GB",
      async function exists(candidate) {
        return existing.has(candidate);
      },
    );

    expect(slug).toBe("iphone-13-128gb-3");
  });

  it("allows same slug when scoped checker belongs to another business", async function testTenantScope() {
    const slug = await resolveUniqueSlug(
      "iPhone 13 128GB",
      async function exists() {
        return false;
      },
    );

    expect(slug).toBe("iphone-13-128gb");
  });
});
