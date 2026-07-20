import "server-only";

import { createHash } from "node:crypto";

function normalizeHashText(value: string): string {
  return value.normalize("NFKC").replace(/\s+/gu, " ").trim().toLocaleLowerCase();
}

export function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function createContextHash(sentence: string): string {
  return sha256(normalizeHashText(sentence));
}

export function createTranslationRequestHash(input: {
  userId: string;
  materialId: string;
  selectedText: string;
  sentence: string;
  sourceLanguage: string;
  targetLanguage: string;
  operation: string;
  promptVersion: string;
}): string {
  return sha256(JSON.stringify({
    userId: input.userId,
    materialId: input.materialId,
    selectedText: normalizeHashText(input.selectedText),
    sentence: normalizeHashText(input.sentence),
    sourceLanguage: input.sourceLanguage.toLocaleLowerCase(),
    targetLanguage: input.targetLanguage.toLocaleLowerCase(),
    operation: input.operation,
    promptVersion: input.promptVersion,
  }));
}

export function createSafetyIdentifier(userId: string): string {
  return sha256(`aula-study-user:${userId}`);
}
