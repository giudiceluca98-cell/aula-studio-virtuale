import { describe, expect, it } from "vitest";
import { canShareSelectedText, canUseRoomSharedContext, resolveEveRoles } from "@/features/eve/context/roles";

describe("CORE-1.4 ruoli Eve", () => {
  it("mappa un membro ordinario a student", () => {
    expect(resolveEveRoles("member", [])).toEqual(["student"]);
  });
  it("mappa owner e admin al ruolo Eve admin", () => {
    expect(resolveEveRoles("owner", [])).toContain("admin");
    expect(resolveEveRoles("admin", [])).toContain("admin");
  });
  it("non inventa teacher o author", () => {
    expect(resolveEveRoles("member", [])).not.toContain("teacher");
    expect(resolveEveRoles("member", [])).not.toContain("author");
  });
  it("limita contesto e selezione condivisi", () => {
    expect(canUseRoomSharedContext(["student"])).toBe(false);
    expect(canUseRoomSharedContext(["author"])).toBe(true);
    expect(canShareSelectedText(["author"])).toBe(false);
    expect(canShareSelectedText(["teacher"])).toBe(true);
  });
});
