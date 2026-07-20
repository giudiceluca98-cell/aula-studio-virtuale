import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/0007_material_reader_progress.sql"),
  "utf8",
).toLowerCase();

describe("material reader progress security", () => {
  it("enables RLS and checks both identity and active room membership", () => {
    expect(migration).toContain("alter table public.material_reader_progress enable row level security");
    expect(migration.match(/\(select auth\.uid\(\)\) = user_id/g)?.length).toBeGreaterThanOrEqual(4);
    expect(migration.match(/public\.is_room_member\(room_id\)/g)?.length).toBeGreaterThanOrEqual(4);
  });

  it("binds progress to the real material and room", () => {
    expect(migration).toContain("foreign key (material_id, room_id)");
    expect(migration).toContain("references public.materials(id, room_id)");
    expect(migration).toContain("primary key (user_id, material_id)");
  });

  it("does not allow updates to identity or material columns", () => {
    const updateGrant = migration.match(/grant update \([\s\S]*?\) on public\.material_reader_progress to authenticated;/)?.[0] ?? "";
    expect(updateGrant).not.toContain("user_id");
    expect(updateGrant).not.toContain("material_id");
    expect(updateGrant).not.toContain("room_id");
    expect(updateGrant).toContain("paragraph_index");
  });
});
