export type ReaderTokenKind = "word" | "space" | "punctuation";

export interface ReaderToken {
  id: string;
  text: string;
  normalized: string | null;
  kind: ReaderTokenKind;
  paragraphIndex: number;
  sentenceIndex: number;
  tokenIndex: number;
  charStart: number;
  charEnd: number;
}

export interface ReaderSentence {
  text: string;
  sentenceIndex: number;
  charStart: number;
  charEnd: number;
  tokens: ReaderToken[];
}

export interface ReaderParagraph {
  text: string;
  paragraphIndex: number;
  sentences: ReaderSentence[];
}
