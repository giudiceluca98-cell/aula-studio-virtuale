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

export interface EveCompositionStatus {
  checkpoint: "CORE-1.2";
  integrationEnabled: boolean;
  architectureReady: boolean;
  serviceConfigured: boolean;
  generatedAt: string;
  features: readonly EveFeatureDescriptor[];
  probes: readonly EveServiceProbe[];
}

export interface EveAuthorizedContext {
  userId: string;
  roomId: string;
  courseId?: string;
  lessonId?: string;
  selectedText?: string;
  roles: readonly string[];
}
