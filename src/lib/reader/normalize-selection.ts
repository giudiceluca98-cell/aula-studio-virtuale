const EDGE_PUNCTUATION = /^[^\p{L}\p{M}\p{N}]+|[^\p{L}\p{M}\p{N}]+$/gu;
const SINGLE_WORD = /^[\p{L}\p{M}\p{N}]+(?:['’\-][\p{L}\p{M}\p{N}]+)*$/u;

/** Returns a stable, lowercase form only when the selection is a single word. */
export function normalizeSelection(value: string): string | null {
  const normalized = value
    .normalize("NFKC")
    .trim()
    .replace(EDGE_PUNCTUATION, "")
    .toLocaleLowerCase();

  if (!normalized || !SINGLE_WORD.test(normalized)) return null;
  return normalized;
}
