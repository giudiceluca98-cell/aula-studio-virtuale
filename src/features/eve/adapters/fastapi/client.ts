import "server-only";

import type { EveServiceConfig } from "@/lib/ai/eve-service-config";
import { FASTAPI_PROBE_PATHS, type FastApiCatalogStatus, type FastApiHealthResponse, type FastApiProbePath } from "./contracts";

export class EveAdapterError extends Error {
  constructor(public readonly code: string, message: string) { super(message); this.name = "EveAdapterError"; }
}

type FetchLike = (input: URL | RequestInfo, init?: RequestInit) => Promise<Response>;

export class EveFastApiAdapter {
  constructor(private readonly config: EveServiceConfig, private readonly fetchImpl: FetchLike = fetch) {}

  private endpoint(path: FastApiProbePath): URL {
    const endpoint = new URL(path.replace(/^\//, ""), this.config.baseUrl);
    if (endpoint.origin !== this.config.baseUrl.origin) throw new EveAdapterError("invalid_origin", "Endpoint adapter non consentito");
    return endpoint;
  }

  private async getJson<T>(path: FastApiProbePath): Promise<T> {
    if (!this.config.enabled) throw new EveAdapterError("integration_disabled", "Integrazione Eve CORE disattivata");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);
    try {
      const headers: Record<string, string> = { Accept: "application/json" };
      if (this.config.bearerToken) headers.Authorization = `Bearer ${this.config.bearerToken}`;
      const response = await this.fetchImpl(this.endpoint(path), { method: "GET", headers, redirect: "error", cache: "no-store", signal: controller.signal });
      if (!response.ok) throw new EveAdapterError(`http_${response.status}`, "Servizio Eve non disponibile");
      const contentType = response.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
      if (contentType !== "application/json") throw new EveAdapterError("invalid_content_type", "Risposta adapter non JSON");
      const declaredLength = Number.parseInt(response.headers.get("content-length") ?? "", 10);
      if (Number.isFinite(declaredLength) && declaredLength > this.config.maxResponseBytes) throw new EveAdapterError("response_too_large", "Risposta adapter troppo grande");
      const text = await response.text();
      if (new TextEncoder().encode(text).byteLength > this.config.maxResponseBytes) throw new EveAdapterError("response_too_large", "Risposta adapter troppo grande");
      try { return JSON.parse(text) as T; }
      catch { throw new EveAdapterError("invalid_json", "Risposta adapter non valida"); }
    } catch (error) {
      if (error instanceof EveAdapterError) throw error;
      if (error instanceof Error && error.name === "AbortError") throw new EveAdapterError("timeout", "Timeout adapter Eve");
      throw new EveAdapterError("network_error", "Connessione adapter Eve non riuscita");
    } finally { clearTimeout(timeout); }
  }

  health(): Promise<FastApiHealthResponse> { return this.getJson(FASTAPI_PROBE_PATHS.health); }
  requirementsStatus(): Promise<FastApiCatalogStatus> { return this.getJson(FASTAPI_PROBE_PATHS.requirements); }
  materialsStatus(): Promise<FastApiCatalogStatus> { return this.getJson(FASTAPI_PROBE_PATHS.materials); }
  researchStatus(): Promise<FastApiCatalogStatus> { return this.getJson(FASTAPI_PROBE_PATHS.research); }
}
