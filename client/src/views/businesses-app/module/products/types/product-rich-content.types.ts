export type ProductRichContentBlockType =
  | "heading"
  | "paragraph"
  | "list"
  | "specs";

export type ProductRichContentHeadingLevel = 2 | 3;

export type ProductRichContentListStyle = "bullet" | "numbered";

export interface ProductRichContentHeadingBlock {
  type: "heading";
  level: ProductRichContentHeadingLevel;
  text: string;
}

export interface ProductRichContentParagraphBlock {
  type: "paragraph";
  text: string;
}

export interface ProductRichContentListBlock {
  type: "list";
  style: ProductRichContentListStyle;
  items: string[];
}

export interface ProductRichContentSpecsItem {
  label: string;
  value: string;
}

export interface ProductRichContentSpecsBlock {
  type: "specs";
  items: ProductRichContentSpecsItem[];
}

export type ProductRichContentBlock =
  | ProductRichContentHeadingBlock
  | ProductRichContentParagraphBlock
  | ProductRichContentListBlock
  | ProductRichContentSpecsBlock;

export interface ProductRichContent {
  version: 1;
  blocks: ProductRichContentBlock[];
}
