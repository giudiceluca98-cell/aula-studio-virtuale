import type { EveRole } from "../contracts";
import type { EveRoomMemberRole } from "./contracts";

const ROLE_ORDER: readonly EveRole[] = ["student", "teacher", "author", "admin"];

export function resolveEveRoles(
  memberRole: EveRoomMemberRole,
  explicitRoles: readonly EveRole[],
): readonly EveRole[] {
  const roles = new Set<EveRole>();
  if (memberRole === "member") roles.add("student");
  if (memberRole === "owner" || memberRole === "admin") roles.add("admin");
  for (const role of explicitRoles) roles.add(role);
  return ROLE_ORDER.filter((role) => roles.has(role));
}

export function canUseRoomSharedContext(roles: readonly EveRole[]): boolean {
  return roles.some((role) => role === "teacher" || role === "author" || role === "admin");
}

export function canShareSelectedText(roles: readonly EveRole[]): boolean {
  return roles.some((role) => role === "teacher" || role === "admin");
}
