import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/0006_adaptive_vocabulary_foundation.sql"),
  "utf8",
).toLowerCase();

const privateTables = [
  "user_language_preferences",
  "user_vocabulary",
  "vocabulary_occurrences",
  "vocabulary_reviews",
  "vocabulary_learning_events",
  "translation_cache",
];

describe("adaptive vocabulary database security", () => {
  it("enables RLS on every new table", () => {
    for (const table of privateTables) {
      expect(migration).toContain(`alter table public.${table} enable row level security`);
    }
  });

  it("scopes personal records to auth.uid", () => {
    expect(migration.match(/\(select auth\.uid\(\)\) = user_id/g)?.length).toBeGreaterThanOrEqual(7);
    expect(migration).toContain("user_vocabulary_select_own");
    expect(migration).toContain("vocabulary_occurrences_select_own");
    expect(migration).toContain("vocabulary_reviews_select_own");
  });

  it("does not allow the browser to write mastery, evidence or cache", () => {
    expect(migration).not.toMatch(/grant\s+(?:insert|update)[^;]*public\.user_vocabulary[^;]*authenticated/);
    expect(migration).not.toMatch(/grant\s+(?:insert|update|delete|select)[^;]*public\.translation_cache[^;]*authenticated/);
    expect(migration).not.toMatch(/grant\s+(?:insert|update|delete)[^;]*public\.vocabulary_learning_events[^;]*authenticated/);
  });

  it("limits client writes on preferences to non-identity columns", () => {
    expect(migration).toContain("grant insert (");
    expect(migration).toContain("grant update (");
    expect(migration).toContain("on public.user_language_preferences to authenticated");
  });
});

