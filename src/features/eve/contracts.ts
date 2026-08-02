export type EveFeatureLayer =
  | "ui"
  | "agent"
  | "prompts"
  | "context"
  | "retrieval"
  | "memory"
  | "tools"
  | "voice"
  | "safety"
  | "evaluation";

export type EveFeatureMaturity =
  | "contract_ready"
  | "prototype_adapter"
  | "planned"
  | "existing_ui_contract";

export interface EveFeatureDescriptor {
  key: EveFeatureLayer;
  ownerPath: `src/features/eve/${string}`;
  maturity: EveFeatureMaturity;
  serverOnly: boolean;
  featureFlag: string | null;
  adapters: readonly string[];
  description: string;
}

export interface EveServiceProbe {
  key: "health" | "requirements" | "materials" | "research";
  state: "available" | "disabled" | "unavailable";
  checkpoint: string | null;
  detail: string;
}

export interface EveCompositionDatabaseSummary {
  state: "disabled" | "ready" | "unavailable" | "schema_mismatch";
  schemaVersion: string | null;
  importsEnabled: boolean;
}

export interface EveCompositionContextSummary {
  state: "disabled" | "ready" | "misconfigured";
  signingConfigured: boolean;
  maxSelectedChars: number;
  maxAuthorizedMaterials: number;
  tokenTtlSeconds: number;
  sharedSelectionEnabled: boolean;
}

export interface EveCompositionUiSummary {
  state: "disabled" | "ready" | "misconfigured";
  defaultMode: "side" | "expanded";
  allowExpanded: boolean;
  restorePreference: boolean;
  animationRuntime: "eve-animation-library-1.2.6";
  entryPoints: readonly ["lesson", "catalog", "room"];
}

export interface EveCompositionProviderSummary {
  state: "disabled" | "misconfigured" | "ready";
  providerKey: string;
  modelKey: string | null;
  profileKey: string;
  secretConfigured: boolean;
  fallback: "mock";
}

export interface EveCompositionStatus {
  checkpoint: "CORE-1.6";
  integrationEnabled: boolean;
  architectureReady: boolean;
  serviceConfigured: boolean;
  generatedAt: string;
  features: readonly EveFeatureDescriptor[];
  probes: readonly EveServiceProbe[];
  database: EveCompositionDatabaseSummary;
  context: EveCompositionContextSummary;
  ui: EveCompositionUiSummary;
  provider: EveCompositionProviderSummary;
}

export type EveRole = "student" | "teacher" | "author" | "admin";
export type EveContextScope = "private" | "room_shared";

export interface EveAuthorizedContext {
  version: "1.4";
  checkpoint: "CORE-1.4";
  userId: string;
  roomId: string;
  roles: readonly EveRole[];
  scope: EveContextScope;
  conversationId?: string;
  courseId?: string;
  subjectId?: string;
  moduleId?: string;
  lessonId?: string;
  sectionId?: string;
  primaryMaterialId?: string;
  authorizedMaterialIds: readonly string[];
  selectedText?: string;
  selectedTextSha256?: string;
  selectionLocator?: string;
  issuedAt: string;
  expiresAt: string;
  nonce: string;
}
