import { describe, expect, it } from "vitest";

import { normalizeSelection } from "@/lib/reader/normalize-selection";
import { parseTextDocument, tokenizeParagraph } from "@/lib/reader/tokenize";

describe("TXT reader normalization", () => {
  it("normalizes one Unicode word and preserves internal apostrophes", () => {
    expect(normalizeSelection("  “L’ALBERO!”  ")).toBe("l’albero");
    expect(normalizeSelection("ÉCOLE")).toBe("école");
  });

  it("rejects multi-word selections and punctuation", () => {
    expect(normalizeSelection("two words")).toBeNull();
    expect(normalizeSelection("..." )).toBeNull();
  });
});

describe("TXT reader segmentation", () => {
  it("keeps paragraphs, sentences, whitespace and punctuation", () => {
    const document = parseTextDocument("Hello world! Next line.\n\nSecond paragraph?");
    expect(document).toHaveLength(2);
    expect(document[0].sentences.length).toBeGreaterThanOrEqual(2);
    expect(document[0].sentences.flatMap((sentence) => sentence.tokens).map((token) => token.text).join(""))
      .toBe("Hello world! Next line.");
    expect(document[1].text).toBe("Second paragraph?");
  });

  it("assigns stable token offsets and kinds", () => {
    const paragraph = tokenizeParagraph("Study, together.", 3);
    const tokens = paragraph.sentences.flatMap((sentence) => sentence.tokens);
    expect(tokens.find((token) => token.text === "Study")).toMatchObject({
      id: "3:0:0",
      kind: "word",
      normalized: "study",
      charStart: 0,
      charEnd: 5,
    });
    expect(tokens.find((token) => token.text === ",")?.kind).toBe("punctuation");
    expect(tokens.find((token) => token.text === " ")?.kind).toBe("space");
  });

  it("removes BOM and supports Windows line endings", () => {
    expect(parseTextDocument("\uFEFFFirst\r\n\r\nSecond").map((item) => item.text))
      .toEqual(["First", "Second"]);
  });
});
