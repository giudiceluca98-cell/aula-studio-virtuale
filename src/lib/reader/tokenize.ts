import { normalizeSelection } from "./normalize-selection";
import type { ReaderParagraph, ReaderSentence, ReaderToken } from "./reader-types";

const TOKEN_PATTERN = /[\p{L}\p{M}\p{N}]+(?:['’\-][\p{L}\p{M}\p{N}]+)*|\s+|[^\s]/gu;

interface TextSegment {
  text: string;
  index: number;
}

function sentenceSegments(text: string, locale: string): TextSegment[] {
  if (typeof Intl.Segmenter === "function") {
    const segmenter = new Intl.Segmenter(locale, { granularity: "sentence" });
    return Array.from(segmenter.segment(text), (part) => ({
      text: part.segment,
      index: part.index,
    }));
  }

  const segments: TextSegment[] = [];
  const pattern = /[^.!?]+(?:[.!?]+(?:[”’"')\]]+)?|$)/gu;
  for (const match of text.matchAll(pattern)) {
    if (match[0]) segments.push({ text: match[0], index: match.index });
  }
  return segments.length ? segments : [{ text, index: 0 }];
}

function tokenizeSentence(
  segment: TextSegment,
  paragraphIndex: number,
  sentenceIndex: number,
  firstTokenIndex: number,
): ReaderToken[] {
  const tokens: ReaderToken[] = [];
  let tokenIndex = firstTokenIndex;

  for (const match of segment.text.matchAll(TOKEN_PATTERN)) {
    const text = match[0];
    const charStart = segment.index + match.index;
    const normalized = normalizeSelection(text);
    const kind = /^\s+$/u.test(text)
      ? "space"
      : normalized
        ? "word"
        : "punctuation";

    tokens.push({
      id: `${paragraphIndex}:${sentenceIndex}:${tokenIndex}`,
      text,
      normalized,
      kind,
      paragraphIndex,
      sentenceIndex,
      tokenIndex,
      charStart,
      charEnd: charStart + text.length,
    });
    tokenIndex += 1;
  }

  return tokens;
}

export function tokenizeParagraph(
  text: string,
  paragraphIndex: number,
  locale = "en",
): ReaderParagraph {
  let nextTokenIndex = 0;
  const sentences: ReaderSentence[] = sentenceSegments(text, locale).map((segment, sentenceIndex) => {
    const tokens = tokenizeSentence(segment, paragraphIndex, sentenceIndex, nextTokenIndex);
    nextTokenIndex += tokens.length;
    return {
      text: segment.text,
      sentenceIndex,
      charStart: segment.index,
      charEnd: segment.index + segment.text.length,
      tokens,
    };
  });

  return { text, paragraphIndex, sentences };
}

export function parseTextDocument(text: string, locale = "en"): ReaderParagraph[] {
  return text
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/u)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph, paragraphIndex) => tokenizeParagraph(paragraph, paragraphIndex, locale));
}
