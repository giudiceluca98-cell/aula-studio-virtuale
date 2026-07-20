import "server-only";
import type { StudyRoomSummary } from "@/lib/types";

export interface StudySummaryProvider {
  readonly name: string;
  summarize(input: StudyRoomSummary, signal?: AbortSignal): Promise<string>;
}

/**
 * Optional extension point for a future server-side AI provider. The MVP uses the
 * deterministic local formatter, so no paid API or browser-exposed key is needed.
 */
export async function generateWithOptionalProvider(
  input: StudyRoomSummary,
  provider?: StudySummaryProvider,
  signal?: AbortSignal,
): Promise<string | null> {
  if (!provider) return null;
  return provider.summarize(input, signal);
}
