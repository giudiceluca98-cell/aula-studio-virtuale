export interface FastApiHealthResponse {
  status: string;
  enabled: boolean;
  provider: string;
  environment: string;
  service_version: string;
}

export interface FastApiCatalogStatus {
  persistent?: boolean;
  schema_version?: number;
  checkpoint?: string;
  stage?: string;
}

export type FastApiProbePath =
  | "/health"
  | "/v1/requirements/status"
  | "/v1/materials/status"
  | "/v1/intelligence/research/status";
export type FastApiMvpPath = "/v1/rag/chat" | "/v1/sources/open";
export type FastApiGroundedChatPath = "/v1/chat";
export type FastApiPath = FastApiProbePath | FastApiMvpPath | FastApiGroundedChatPath;

export const FASTAPI_PROBE_PATHS = Object.freeze({
  health: "/health",
  requirements: "/v1/requirements/status",
  materials: "/v1/materials/status",
  research: "/v1/intelligence/research/status",
} as const satisfies Record<string, FastApiProbePath>);

export interface FastApiStudyContext {
  user_id: string;
  room_id: string;
  course_id?: string;
  lesson_id?: string;
  section_id?: string;
  selected_text?: string;
  permission_level: "read";
}

export interface FastApiRagChatRequest {
  message: string;
  context: FastApiStudyContext;
  mode: string;
  limit: number;
  material_ids?: readonly string[];
}

export interface FastApiRetrievalCitation {
  locator: string;
  material_id: string;
  version_id: number;
  version_number: number;
  chunk_id: number;
  chunk_index: number;
  title: string;
  filename: string;
  media_type: string;
  start_char: number;
  end_char: number;
  text_sha256: string;
}

export interface FastApiRagSource {
  rank: number;
  score: number;
  excerpt: string;
  matched_terms: readonly string[];
  exact_phrase: boolean;
  suspicious_content: boolean;
  safety_flags: readonly string[];
  citation: FastApiRetrievalCitation;
}

export interface FastApiRagChatResponse {
  message: string;
  provider: string;
  model: string;
  uncertainty: string;
  grounded: boolean;
  knowledge_scope: string;
  retrieval_stage: string;
  query_sha256: string;
  answer_sha256: string;
  total_candidates: number;
  integrity_failures: number;
  excluded_suspicious_hits: number;
  sources: readonly FastApiRagSource[];
  proposed_actions: readonly Readonly<Record<string, unknown>>[];
}

export interface FastApiSourceOpenRequest {
  room_id: string;
  locator: string;
  expected_text_sha256?: string;
  context_chars?: number;
  require_current?: boolean;
}

export interface FastApiSourceOpenResponse {
  opened: boolean;
  room_id: string;
  locator: string;
  material_id: string;
  title: string;
  source_label?: string | null;
  version_id: number;
  version_number: number;
  current_version_number?: number | null;
  is_current: boolean;
  stale: boolean;
  filename: string;
  media_type: string;
  source_type: string;
  chunk_id: number;
  chunk_index: number;
  start_char: number;
  end_char: number;
  text: string;
  text_sha256: string;
  integrity_verified: boolean;
  expected_hash_verified?: boolean | null;
  context_start_char: number;
  context_end_char: number;
  context_text: string;
  suspicious_content: boolean;
  safety_flags: readonly string[];
  content_trust: string;
  instructions_executable: boolean;
  navigation: Readonly<Record<string, unknown>>;
}


export interface FastApiModelChatRequest {
  message: string;
  context: FastApiStudyContext;
  mode: "grounded-structured";
}

export interface FastApiModelSourceReference {
  title: string;
  locator?: string | null;
}

export interface FastApiModelChatResponse {
  message: string;
  provider: string;
  model: string;
  uncertainty: string;
  sources: readonly FastApiModelSourceReference[];
  proposed_actions: readonly Readonly<Record<string, unknown>>[];
}
