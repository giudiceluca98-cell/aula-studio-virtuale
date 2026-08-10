import "server-only";
import { readExternalProviderStatus } from "../agent/provider-status";
import { readEveContextStatus } from "../context/status";
import { readEveServiceConfig } from "@/lib/ai/eve-service-config";
import { readEveGroundedChatConfig } from "./config";
import type { EveGroundedChatStatus } from "./contracts";

export function readEveGroundedChatStatus(): EveGroundedChatStatus {
  try {
    const config = readEveGroundedChatConfig();
    const context = readEveContextStatus();
    const integration = readEveServiceConfig();
    const provider = readExternalProviderStatus();
    const ready = config.enabled && context.state === "ready" && integration.enabled && provider.state === "ready";
    return {
      checkpoint: "CORE-2.0",
      state: !config.enabled ? "disabled" : ready ? "ready" : "misconfigured",
      enabled: config.enabled,
      contextEnabled: context.state === "ready",
      integrationEnabled: integration.enabled,
      externalProviderReady: provider.state === "ready",
      requireCitations: config.requireCitations,
      allowGeneralKnowledge: config.allowGeneralKnowledge,
      deterministicFallback: config.deterministicFallback,
      defaultDepth: config.defaultDepth,
      maxMessageChars: config.maxMessageChars,
      maxSources: config.maxSources,
      privateOnly: true,
      memoryWrites: false,
      actionsExecuted: false,
    };
  } catch {
    return {
      checkpoint: "CORE-2.0", state: "misconfigured", enabled: false,
      contextEnabled: false, integrationEnabled: false, externalProviderReady: false,
      requireCitations: true, allowGeneralKnowledge: false, deterministicFallback: true,
      defaultDepth: "normal", maxMessageChars: 8000, maxSources: 6,
      privateOnly: true, memoryWrites: false, actionsExecuted: false,
    };
  }
}
