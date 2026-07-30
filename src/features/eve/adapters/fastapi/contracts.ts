export interface FastApiHealthResponse { status: string; enabled: boolean; provider: string; environment: string; service_version: string; }
export interface FastApiCatalogStatus { persistent?: boolean; schema_version?: number; checkpoint?: string; stage?: string; }
export type FastApiProbePath = "/health" | "/v1/requirements/status" | "/v1/materials/status" | "/v1/intelligence/research/status";
export const FASTAPI_PROBE_PATHS = Object.freeze({
  health: "/health",
  requirements: "/v1/requirements/status",
  materials: "/v1/materials/status",
  research: "/v1/intelligence/research/status",
} as const satisfies Record<string, FastApiProbePath>);
