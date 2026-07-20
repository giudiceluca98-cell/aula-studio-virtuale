export interface WatchedRange { start: number; end: number }

export function mergeWatchedRanges(ranges: WatchedRange[], maxGapSeconds = 1.5): WatchedRange[] {
  const valid = ranges
    .filter((range) => Number.isFinite(range.start) && Number.isFinite(range.end) && range.end > range.start && range.start >= 0)
    .map((range) => ({ start: Math.round(range.start * 10) / 10, end: Math.round(range.end * 10) / 10 }))
    .sort((a, b) => a.start - b.start || a.end - b.end);
  const merged: WatchedRange[] = [];
  for (const range of valid) {
    const previous = merged.at(-1);
    if (!previous || range.start > previous.end + maxGapSeconds) merged.push({ ...range });
    else previous.end = Math.max(previous.end, range.end);
  }
  return merged.slice(-500);
}

export function addWatchedInterval(ranges: WatchedRange[], start: number, end: number, durationSeconds: number): WatchedRange[] {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || end - start <= 0 || end - start > 15) return mergeWatchedRanges(ranges);
  return mergeWatchedRanges([...ranges, { start: Math.max(0, start), end: Math.min(durationSeconds, end) }]);
}

export function watchedUniqueSeconds(ranges: WatchedRange[]): number {
  return Math.round(mergeWatchedRanges(ranges).reduce((sum, range) => sum + range.end - range.start, 0));
}

export function videoCompletionPercentage(ranges: WatchedRange[], durationSeconds: number): number {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return 0;
  return Math.min(100, Math.round((watchedUniqueSeconds(ranges) / durationSeconds) * 100));
}

export function isVideoCompleted(ranges: WatchedRange[], durationSeconds: number): boolean {
  return durationSeconds >= 10 && videoCompletionPercentage(ranges, durationSeconds) >= 90;
}

export function shouldCountActiveTime(lastInteractionAt: number, now: number, visible: boolean, playing = false, idleAfterMs = 60_000) {
  return visible && (playing || now - lastInteractionAt <= idleAfterMs);
}
