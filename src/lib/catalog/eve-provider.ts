import "server-only";

import type { ZodType } from "zod";
import type { WebSearchMaterial } from "./types";

export class EveProviderError extends Error {
  constructor(public readonly code: string, public readonly dispatched: boolean) { super(code); this.name = "EveProviderError"; }
}

interface EveRequest<T> {
  apiKey: string;
  model: string;
  instructions: string;
  input: unknown;
  schemaName: string;
  schemaDescription: string;
  jsonSchema: Record<string, unknown>;
  validator: ZodType<T>;
  safetyIdentifier: string;
  timeoutMs: number;
  maxOutputTokens: number;
}

interface RawResponse {
  output?: Array<{
    type?: string;
    action?: { sources?: Array<{ url?: string; title?: string }> };
    content?: Array<{
      type?: string;
      text?: string;
      annotations?: Array<{ type?: string; url?: string; title?: string }>;
    }>;
  }>;
  usage?: { input_tokens?: number; output_tokens?: number; input_tokens_details?: { cached_tokens?: number } };
}

interface EveCurriculumSearchRequest<T> {
  apiKey: string;
  model: string;
  query: string;
  existingMaterials: Array<{ id: string; title: string; description: string; provider: string; url: string; level: string }>;
  safetyIdentifier: string;
  timeoutMs: number;
  jsonSchema: Record<string, unknown>;
  validator: ZodType<T>;
}

function safeWebSource(urlValue: string | undefined, titleValue: string | undefined): WebSearchMaterial | null {
  if (!urlValue) return null;
  try {
    const url = new URL(urlValue);
    const hostname = url.hostname.toLowerCase();
    if (url.protocol !== "https:" || !hostname || hostname === "localhost" || hostname.endsWith(".local")) return null;
    if (/^(?:127\.|10\.|0\.|169\.254\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/.test(hostname)) return null;
    const title = titleValue?.trim().slice(0, 240) || hostname;
    const extension = url.pathname.split("/").pop()?.match(/\.([a-z0-9]{1,8})$/i)?.[1]?.toLowerCase() ?? null;
    if (["exe", "msi", "dmg", "pkg", "apk", "bat", "cmd", "ps1", "sh", "scr"].includes(extension ?? "")) return null;
    const resourceType: WebSearchMaterial["resourceType"] = /(?:youtube\.com|youtu\.be|vimeo\.com)$/i.test(hostname) ? "video"
      : extension === "pdf" || /\bpdf\b/i.test(title)
      ? "pdf"
      : ["doc", "docx", "odt", "rtf", "txt", "epub"].includes(extension ?? "") ? "document"
      : ["csv", "tsv", "json", "xml", "parquet", "xlsx", "xls"].includes(extension ?? "") ? "dataset"
      : ["ipynb"].includes(extension ?? "") ? "notebook"
      : ["zip", "tar", "gz", "7z"].includes(extension ?? "") ? "archive"
      : extension ? "file" : "page";
    return {
      title,
      url: url.toString().slice(0, 4096),
      domain: hostname.replace(/^www\./, "").slice(0, 160),
      description: resourceType === "page" ? "Pagina didattica citata da Eve per questa ricerca." : `File ${extension?.toUpperCase() ?? resourceType} collegato alla materia. Controlla fonte, licenza e contenuto prima di salvarlo.`,
      sourceType: "web",
      resourceType,
      fileExtension: extension,
    };
  } catch {
    return null;
  }
}

function responseUsage(payload: RawResponse) {
  return {
    inputTokens: payload.usage?.input_tokens ?? 0,
    cachedInputTokens: payload.usage?.input_tokens_details?.cached_tokens ?? 0,
    outputTokens: payload.usage?.output_tokens ?? 0,
  };
}

function outputText(payload: RawResponse) {
  for (const item of payload.output ?? []) for (const content of item.content ?? []) if (content.type === "output_text" && content.text) return content.text;
  return null;
}

export async function callEveStructured<T>(request: EveRequest<T>) {
  if (!request.apiKey) throw new EveProviderError("PROVIDER_NOT_CONFIGURED", false);
  if (request.model.includes("sol")) throw new EveProviderError("SOL_REQUIRES_CONSENT", false);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), request.timeoutMs);
  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${request.apiKey}`, "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: request.model,
        store: false,
        safety_identifier: request.safetyIdentifier,
        reasoning: { effort: request.model.includes("luna") ? "none" : "low" },
        instructions: request.instructions,
        input: JSON.stringify(request.input),
        max_output_tokens: request.maxOutputTokens,
        text: { verbosity: "low", format: { type: "json_schema", name: request.schemaName, description: request.schemaDescription, strict: true, schema: request.jsonSchema } },
      }),
    });
  } catch (error) {
    throw new EveProviderError(error instanceof Error && error.name === "AbortError" ? "PROVIDER_TIMEOUT" : "PROVIDER_NETWORK_ERROR", true);
  } finally { clearTimeout(timeout); }
  if (!response.ok) throw new EveProviderError(`PROVIDER_HTTP_${response.status}`, true);
  const payload = await response.json() as RawResponse;
  const text = outputText(payload);
  if (!text) throw new EveProviderError("PROVIDER_EMPTY_OUTPUT", true);
  let decoded: unknown;
  try { decoded = JSON.parse(text); } catch { throw new EveProviderError("PROVIDER_INVALID_JSON", true); }
  const parsed = request.validator.safeParse(decoded);
  if (!parsed.success) throw new EveProviderError("PROVIDER_INVALID_OUTPUT", true);
  return { data: parsed.data, usage: responseUsage(payload) };
}

interface EveWebSearchRequest {
  apiKey: string;
  model: string;
  query: string;
  safetyIdentifier: string;
  timeoutMs: number;
  maxResults?: number;
}

export async function callEveWebSearch(request: EveWebSearchRequest) {
  if (!request.apiKey) throw new EveProviderError("PROVIDER_NOT_CONFIGURED", false);
  if (request.model.includes("sol")) throw new EveProviderError("SOL_REQUIRES_CONSENT", false);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), request.timeoutMs);
  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${request.apiKey}`, "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: request.model,
        store: false,
        safety_identifier: request.safetyIdentifier,
        reasoning: { effort: request.model.includes("luna") ? "none" : "low" },
        instructions: "Ti chiami Eve. Cerca una combinazione di fonti didattiche reali e file direttamente utili all'obiettivo: pagine ufficiali, corsi, dispense PDF, documenti, dataset, notebook ed esercizi scaricabili. Preferisci universita, istituzioni e documentazione ufficiale. Per i file usa, quando esiste, il collegamento HTTPS diretto al file. Evita pagine generiche, duplicati, aggregatori, file senza provenienza chiara ed eseguibili. Ogni proposta deve essere supportata da una citazione della ricerca web. Non inventare URL, prezzi, autori, licenze o certificazioni.",
        input: `Obiettivo di studio: ${request.query}. Trova fonti web e anche PDF o altri file didattici pertinenti.`,
        tools: [{ type: "web_search", search_context_size: "low" }],
        tool_choice: "auto",
        include: ["web_search_call.action.sources"],
        max_output_tokens: 500,
      }),
    });
  } catch (error) {
    throw new EveProviderError(error instanceof Error && error.name === "AbortError" ? "WEB_SEARCH_TIMEOUT" : "WEB_SEARCH_NETWORK_ERROR", true);
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) throw new EveProviderError(`WEB_SEARCH_HTTP_${response.status}`, true);
  const payload = await response.json() as RawResponse;
  const candidates: WebSearchMaterial[] = [];
  for (const item of payload.output ?? []) {
    for (const source of item.action?.sources ?? []) {
      const normalized = safeWebSource(source.url, source.title);
      if (normalized) candidates.push(normalized);
    }
    for (const content of item.content ?? []) {
      for (const annotation of content.annotations ?? []) {
        if (annotation.type !== "url_citation") continue;
        const normalized = safeWebSource(annotation.url, annotation.title);
        if (normalized) candidates.push(normalized);
      }
    }
  }
  const unique = [...new Map(candidates.map((source) => [source.url, source])).values()].slice(0, request.maxResults ?? 10);
  return { results: unique, usage: responseUsage(payload) };
}

export async function callEveCurriculumSearch<T>(request: EveCurriculumSearchRequest<T>) {
  if (!request.apiKey) throw new EveProviderError("PROVIDER_NOT_CONFIGURED", false);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), request.timeoutMs);
  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${request.apiKey}`, "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: request.model,
        store: false,
        safety_identifier: request.safetyIdentifier,
        reasoning: { effort: "medium" },
        instructions: [
          "Ti chiami Eve e sei una progettista didattica rigorosa.",
          "Crea un curriculum realmente specifico per l'obiettivo richiesto, dalle conoscenze preliminari fino al risultato finale.",
          "Non riutilizzare una struttura generica: moduli, prerequisiti, esercizi e criteri devono dipendere dalla materia e dall'obiettivo.",
          "Cerca sul web risorse didattiche reali per ogni tappa: corsi completi, video o playlist, PDF e dispense, libri aperti, documentazione, dataset, notebook ed esercizi.",
          "Preferisci universita, istituzioni, documentazione ufficiale e fonti autorevoli. Evita aggregatori, pagine generiche, duplicati ed eseguibili.",
          "Per ogni item material usa l'URL HTTPS esatto di una fonte consultata dalla ricerca o di un materiale fornito nel catalogo esistente. Classificalo come page, pdf, document, dataset, notebook, archive, file, video, course, book o podcast.",
          "Non inventare URL, titoli, provider, prezzi, licenze, certificazioni o durate dichiarate dalle fonti.",
          "Inserisci almeno una risorsa reale e una attivita verificabile per modulo. Concludi con un progetto o una prova finale.",
          "Restituisci esclusivamente il JSON richiesto dallo schema.",
        ].join(" "),
        input: JSON.stringify({
          objective: request.query,
          requestedLanguage: "it",
          initialLevel: "no_experience",
          targetLevel: "intermediate",
          weeklyHours: 5,
          existingCatalogMaterials: request.existingMaterials,
        }),
        tools: [{ type: "web_search", search_context_size: "medium" }],
        tool_choice: "auto",
        include: ["web_search_call.action.sources"],
        max_output_tokens: 5000,
        text: {
          verbosity: "low",
          format: {
            type: "json_schema",
            name: "eve_complete_curriculum",
            description: "Curriculum progressivo con materiali web reali collegati alle singole tappe.",
            strict: true,
            schema: request.jsonSchema,
          },
        },
      }),
    });
  } catch (error) {
    throw new EveProviderError(error instanceof Error && error.name === "AbortError" ? "CURRICULUM_TIMEOUT" : "CURRICULUM_NETWORK_ERROR", true);
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) throw new EveProviderError(`CURRICULUM_HTTP_${response.status}`, true);
  const payload = await response.json() as RawResponse;
  const text = outputText(payload);
  if (!text) throw new EveProviderError("CURRICULUM_EMPTY_OUTPUT", true);
  let decoded: unknown;
  try { decoded = JSON.parse(text); } catch { throw new EveProviderError("CURRICULUM_INVALID_JSON", true); }
  const parsed = request.validator.safeParse(decoded);
  if (!parsed.success) throw new EveProviderError("CURRICULUM_INVALID_OUTPUT", true);
  const sources: WebSearchMaterial[] = [];
  for (const item of payload.output ?? []) {
    for (const source of item.action?.sources ?? []) {
      const normalized = safeWebSource(source.url, source.title);
      if (normalized) sources.push(normalized);
    }
    for (const content of item.content ?? []) for (const annotation of content.annotations ?? []) {
      if (annotation.type !== "url_citation") continue;
      const normalized = safeWebSource(annotation.url, annotation.title);
      if (normalized) sources.push(normalized);
    }
  }
  const uniqueSources = [...new Map(sources.map((source) => [source.url, source])).values()].slice(0, 24);
  return { data: parsed.data, results: uniqueSources, usage: responseUsage(payload) };
}
