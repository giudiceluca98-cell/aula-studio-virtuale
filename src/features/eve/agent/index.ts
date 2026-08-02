import type { EveAuthorizedContext } from "../contracts";
export interface EveAgentRequest { message: string; context: EveAuthorizedContext; mode: "chat" | "tutor" | "evaluation"; }
export interface EveAgentResult { answer: string; citations: readonly string[]; provider: string; }
export { readExternalProviderStatus } from "./provider-status";
