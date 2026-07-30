import type { EveAuthorizedContext } from "../contracts";
export function minimizeEveContext(context: EveAuthorizedContext): EveAuthorizedContext {
  return { ...context, selectedText: context.selectedText?.slice(0, 4_000) };
}
