import { describe, expect, it } from "vitest";
import {
  parseProductRichContentFromDb,
  productRichContentSchema,
  serializeProductRichContent,
} from "@/shared/product-rich-content.js";

describe("product rich content contract", function productRichContentSuite() {
  it("accepts null from db", function testNullFromDb() {
    expect(parseProductRichContentFromDb(null)).toBeNull();
  });

  it("accepts a valid v1 document", function testValidDocument() {
    const parsed = productRichContentSchema.parse({
      version: 1,
      blocks: [
        { type: "heading", level: 2, text: "Caracteristicas" },
        { type: "paragraph", text: "Producto destacado" },
        { type: "list", style: "bullet", items: ["Liviano", "Resistente"] },
        {
          type: "specs",
          items: [{ label: "Material", value: "Acero" }],
        },
      ],
    });

    expect(parsed.blocks).toHaveLength(4);
  });

  it("rejects invalid version", function testInvalidVersion() {
    expect(function parseInvalidVersion() {
      productRichContentSchema.parse({ version: 2, blocks: [] });
    }).toThrow();
  });

  it("rejects unknown block types", function testUnknownBlockType() {
    expect(function parseUnknownBlock() {
      productRichContentSchema.parse({
        version: 1,
        blocks: [{ type: "html", html: "<script>alert(1)</script>" }],
      });
    }).toThrow();
  });

  it("rejects heading level 1", function testHeadingLevelOne() {
    expect(function parseHeadingLevelOne() {
      productRichContentSchema.parse({
        version: 1,
        blocks: [{ type: "heading", level: 1, text: "Titulo" }],
      });
    }).toThrow();
  });

  it("rejects empty list and specs blocks", function testEmptyCompositeBlocks() {
    expect(function parseEmptyList() {
      productRichContentSchema.parse({
        version: 1,
        blocks: [{ type: "list", style: "bullet", items: [] }],
      });
    }).toThrow();

    expect(function parseEmptySpecs() {
      productRichContentSchema.parse({
        version: 1,
        blocks: [{ type: "specs", items: [] }],
      });
    }).toThrow();
  });

  it("rejects extra properties", function testExtraProperties() {
    expect(function parseExtraProperties() {
      productRichContentSchema.parse({
        version: 1,
        blocks: [{ type: "paragraph", text: "Texto", unsafe: true }],
      });
    }).toThrow();
  });

  it("rejects more than 30 blocks", function testBlocksLimit() {
    expect(function parseTooManyBlocks() {
      productRichContentSchema.parse({
        version: 1,
        blocks: Array.from({ length: 31 }, function createBlock() {
          return { type: "paragraph", text: "Texto" };
        }),
      });
    }).toThrow();
  });

  it("serializes and parses valid string/object db values", function testDbParsing() {
    const document = {
      version: 1 as const,
      blocks: [{ type: "paragraph" as const, text: "Contenido" }],
    };
    const serialized = serializeProductRichContent(document);

    expect(serialized).toBe(JSON.stringify(document));
    expect(parseProductRichContentFromDb(serialized)).toEqual(document);
    expect(parseProductRichContentFromDb(document)).toEqual(document);
  });

  it("throws on malformed db json", function testMalformedDbJson() {
    expect(function parseMalformedJson() {
      parseProductRichContentFromDb("{invalid");
    }).toThrow("PRODUCT_RICH_CONTENT_INVALID");
  });
});
