import type { EveFeatureDescriptor, EveFeatureLayer } from "./contracts";

const feature = (
  key: EveFeatureLayer,
  maturity: EveFeatureDescriptor["maturity"],
  serverOnly: boolean,
  featureFlag: string | null,
  adapters: readonly string[],
  description: string,
): EveFeatureDescriptor => ({
  key,
  ownerPath: `src/features/eve/${key}`,
  maturity,
  serverOnly,
  featureFlag,
  adapters,
  description,
});

export const EVE_FEATURE_REGISTRY = Object.freeze([
  feature("ui", "existing_ui_contract", false, "NEXT_PUBLIC_EVE_ENABLED", [], "Componenti e stati visivi; nessun segreto o provider."),
  feature("agent", "prototype_adapter", true, "EVE_CORE_INTEGRATION_ENABLED", ["fastapi.health"], "Orchestrazione server-side attraverso adapter tipizzati."),
  feature("prompts", "prototype_adapter", true, "EVE_CORE_INTEGRATION_ENABLED", ["fastapi.requirements"], "Contratti prompt e versioni senza accesso diretto dalla UI."),
  feature("context", "prototype_adapter", true, "EVE_CONTEXT_BUILDER_ENABLED", ["supabase.identity", "supabase.rls"], "Identità autenticata, ruoli, permessi e contesto minimizzato verificati sul server."),
  feature("retrieval", "prototype_adapter", true, "EVE_CORE_INTEGRATION_ENABLED", ["fastapi.materials", "fastapi.research"], "Adapter ai prototipi di materiali, retrieval e Intelligence."),
  feature("memory", "planned", true, null, [], "Confine riservato alla memoria esplicita e consensuale."),
  feature("tools", "planned", true, null, [], "Confine riservato agli strumenti tipizzati e autorizzati."),
  feature("voice", "existing_ui_contract", false, "NEXT_PUBLIC_EVE_VOICE_ENABLED", [], "Contratti degli stati voce già presenti, senza acquisizione nascosta."),
  feature("safety", "contract_ready", true, "EVE_CORE_INTEGRATION_ENABLED", [], "Decisioni di sicurezza applicate dal codice server-side."),
  feature("evaluation", "prototype_adapter", true, "EVE_CORE_INTEGRATION_ENABLED", ["fastapi.requirements"], "Evidenze e gate collegabili ai runner FastAPI esistenti."),
] satisfies readonly EveFeatureDescriptor[]);

export function getEveFeatureDescriptor(key: EveFeatureLayer): EveFeatureDescriptor {
  const descriptor = EVE_FEATURE_REGISTRY.find((item) => item.key === key);
  if (!descriptor) throw new Error(`Feature Eve non registrata: ${key}`);
  return descriptor;
}
