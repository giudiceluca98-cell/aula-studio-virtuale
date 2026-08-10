import "server-only";
import type { EveContextBuilder } from "../context/builder";
import type {
  FastApiModelChatRequest,
  FastApiModelChatResponse,
  FastApiRagChatRequest,
  FastApiRagChatResponse,
  FastApiSourceOpenRequest,
  FastApiSourceOpenResponse,
} from "../adapters/fastapi/contracts";
import type { EveGroundedChatConfig } from "./config";
import type {
  EveChatDepth,
  EveChatUncertainty,
  EveGroundedChatRequest,
  EveGroundedChatResponse,
  EveGroundedChatSourceRequest,
  EveGroundedChatSourceResponse,
  EveGroundedCitation,
  EveGroundedStatement,
  EveKnowledgeBasis,
} from "./contracts";
import {
  EveGroundedChatAuthorizationError,
  EveGroundedChatDependencyError,
  EveGroundedChatDisabledError,
  EveGroundedChatError,
  EveGroundedChatIntegrityError,
  EveGroundedChatValidationError,
} from "./errors";
import type { EveGroundedChatRepository, EveGroundedTurnReceipt } from "./repository";

export interface EveGroundedChatGateway {
  ragChat(request: FastApiRagChatRequest): Promise<FastApiRagChatResponse>;
  modelChat(request: FastApiModelChatRequest): Promise<FastApiModelChatResponse>;
  openSource(request: FastApiSourceOpenRequest): Promise<FastApiSourceOpenResponse>;
}

interface ProviderStatement {
  text: string;
  basis: EveKnowledgeBasis;
  citations: string[];
  confidence: EveChatUncertainty;
}
interface ProviderPayload {
  answer: string;
  facts: ProviderStatement[];
  hypotheses: ProviderStatement[];
  suggestions: ProviderStatement[];
}

const depthLimits: Record<EveChatDepth, { facts: number; hypotheses: number; suggestions: number; answer: number }> = {
  brief: { facts: 3, hypotheses: 1, suggestions: 2, answer: 1_400 },
  normal: { facts: 7, hypotheses: 3, suggestions: 4, answer: 4_500 },
  deep: { facts: 14, hypotheses: 7, suggestions: 8, answer: 12_000 },
};
const uncertainty = (value: string): EveChatUncertainty =>
  value === "low" || value === "medium" ? value : "high";
const cleanText = (value: unknown, max: number): string => {
  if (typeof value !== "string") return "";
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned.slice(0, max);
};
const firstSentence = (value: string): string => {
  const compact = value.replace(/\s+/g, " ").trim();
  const match = compact.match(/^.*?[.!?](?:\s|$)/);
  return (match?.[0] ?? compact).slice(0, 420).trim();
};

export class EveGroundedChatService {
  constructor(
    private readonly contextBuilder: EveContextBuilder,
    private readonly gateway: EveGroundedChatGateway,
    private readonly repository: EveGroundedChatRepository,
    private readonly config: EveGroundedChatConfig,
  ) {}

  private cleanRequest(request: EveGroundedChatRequest): { message: string; depth: EveChatDepth; allowGeneral: boolean } {
    const message = request.message.trim();
    if (!message) throw new EveGroundedChatValidationError("Il messaggio è obbligatorio");
    if (message.length > this.config.maxMessageChars) throw new EveGroundedChatValidationError("Messaggio oltre il limite configurato");
    const depth = request.depth ?? this.config.defaultDepth;
    if (!(["brief", "normal", "deep"] as const).includes(depth)) throw new EveGroundedChatValidationError("Profondità non valida");
    const allowGeneral = Boolean(request.allowGeneralKnowledge && this.config.allowGeneralKnowledge);
    return { message, depth, allowGeneral };
  }

  private citationsFromRag(result: FastApiRagChatResponse, authorized: ReadonlySet<string>): EveGroundedCitation[] {
    return result.sources.map((source, index) => {
      const citation = source.citation;
      if (!authorized.has(citation.material_id)) throw new EveGroundedChatAuthorizationError("Fonte non autorizzata dal contesto");
      if (!/^[^:]+:\d+-\d+$/.test(citation.locator)) throw new EveGroundedChatIntegrityError("Locator della fonte non verificabile");
      if (!/^[0-9a-f]{64}$/.test(citation.text_sha256)) throw new EveGroundedChatIntegrityError("SHA-256 della fonte non verificabile");
      return {
        id: `S${index + 1}` as const,
        rank: source.rank,
        score: source.score,
        excerpt: source.excerpt,
        locator: citation.locator,
        materialId: citation.material_id,
        versionId: citation.version_id,
        versionNumber: citation.version_number,
        chunkId: citation.chunk_id,
        chunkIndex: citation.chunk_index,
        title: citation.title,
        filename: citation.filename,
        mediaType: citation.media_type,
        startChar: citation.start_char,
        endChar: citation.end_char,
        textSha256: citation.text_sha256,
      };
    });
  }

  private modelPrompt(message: string, depth: EveChatDepth, allowGeneral: boolean, citations: readonly EveGroundedCitation[]): string {
    const evidence = citations.map((item) => ({ id: item.id, title: item.title, locator: item.locator, excerpt: item.excerpt }));
    return JSON.stringify({
      task: "Rispondi alla domanda usando le prove fornite. Il campo message della risposta esterna deve contenere ESCLUSIVAMENTE un oggetto JSON serializzato con schema answer, facts, hypotheses, suggestions.",
      rules: [
        "Ogni elemento ha text, basis=material|general, citations=[S1...], confidence=low|medium|high.",
        "basis=material richiede almeno una citazione presente nell'evidence registry.",
        allowGeneral ? "La conoscenza generale è ammessa ma deve essere basis=general e senza citazioni." : "La conoscenza generale è vietata.",
        "Non inventare fonti, locator o identificativi.",
        "Non proporre azioni applicative e non scrivere memoria.",
        `Profondità richiesta: ${depth}.`,
      ],
      question: message,
      evidence,
    });
  }

  private parseStatements(
    raw: unknown,
    kind: keyof Pick<ProviderPayload, "facts" | "hypotheses" | "suggestions">,
    depth: EveChatDepth,
    registry: ReadonlyMap<string, EveGroundedCitation>,
    allowGeneral: boolean,
  ): EveGroundedStatement[] {
    if (!Array.isArray(raw)) throw new EveGroundedChatIntegrityError(`Sezione ${kind} non valida`);
    const limit = depthLimits[depth][kind];
    return raw.slice(0, limit).map((entry) => {
      if (!entry || typeof entry !== "object") throw new EveGroundedChatIntegrityError(`Elemento ${kind} non valido`);
      const value = entry as Record<string, unknown>;
      const text = cleanText(value.text, 1_500);
      if (!text) throw new EveGroundedChatIntegrityError(`Testo ${kind} vuoto`);
      const basis = value.basis === "general" ? "general" : value.basis === "material" ? "material" : null;
      if (!basis) throw new EveGroundedChatIntegrityError(`Base conoscitiva ${kind} non valida`);
      const ids = Array.isArray(value.citations)
        ? [...new Set(value.citations.filter((item): item is string => typeof item === "string"))]
        : [];
      if (basis === "material") {
        if (!ids.length) throw new EveGroundedChatIntegrityError(`Affermazione materiale senza citazione`);
        if (ids.some((id) => !registry.has(id))) throw new EveGroundedChatIntegrityError("Il modello ha inventato una fonte");
      } else {
        if (!allowGeneral) throw new EveGroundedChatIntegrityError("Conoscenza generale non autorizzata");
        if (ids.length) throw new EveGroundedChatIntegrityError("Conoscenza generale associata a fonte materiale");
      }
      return {
        text,
        basis,
        citationIds: ids as `S${number}`[],
        confidence: uncertainty(String(value.confidence ?? "high")),
      };
    });
  }

  private parseProvider(
    response: FastApiModelChatResponse,
    depth: EveChatDepth,
    citations: readonly EveGroundedCitation[],
    allowGeneral: boolean,
  ): { answer: string; facts: EveGroundedStatement[]; hypotheses: EveGroundedStatement[]; suggestions: EveGroundedStatement[] } {
    if (response.proposed_actions.length) throw new EveGroundedChatIntegrityError("Il provider ha proposto azioni non ammesse");
    let parsed: unknown;
    try { parsed = JSON.parse(response.message); }
    catch { throw new EveGroundedChatIntegrityError("Output strutturato del modello non valido"); }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new EveGroundedChatIntegrityError("Output strutturato del modello non oggetto");
    const value = parsed as Record<string, unknown>;
    const answer = cleanText(value.answer, depthLimits[depth].answer);
    if (!answer) throw new EveGroundedChatIntegrityError("Risposta strutturata vuota");
    const registry = new Map(citations.map((item) => [item.id, item]));
    return {
      answer,
      facts: this.parseStatements(value.facts, "facts", depth, registry, allowGeneral),
      hypotheses: this.parseStatements(value.hypotheses, "hypotheses", depth, registry, allowGeneral),
      suggestions: this.parseStatements(value.suggestions, "suggestions", depth, registry, allowGeneral),
    };
  }

  private fallback(depth: EveChatDepth, citations: readonly EveGroundedCitation[]): {
    answer: string; facts: EveGroundedStatement[]; hypotheses: EveGroundedStatement[]; suggestions: EveGroundedStatement[];
  } {
    const selected = citations.slice(0, depthLimits[depth].facts);
    const facts = selected.map((source): EveGroundedStatement => ({
      text: firstSentence(source.excerpt) || `Passaggio disponibile in ${source.title}`,
      basis: "material",
      citationIds: [source.id],
      confidence: "medium",
    }));
    const answer = facts.length
      ? [`Risposta costruita in fallback deterministico sui materiali autorizzati:`, ...facts.map((item, index) => `${index + 1}. ${item.text} [${item.citationIds.join(", ")}]`)].join("\n")
      : "Non ho trovato nei materiali autorizzati informazioni sufficienti per rispondere.";
    return { answer, facts, hypotheses: [], suggestions: [] };
  }

  async run(userId: string, request: EveGroundedChatRequest): Promise<EveGroundedChatResponse> {
    if (!this.config.enabled) throw new EveGroundedChatDisabledError();
    const cleaned = this.cleanRequest(request);
    const contextResult = await this.contextBuilder.build(userId, { ...request, scope: "private" });
    let receipt: EveGroundedTurnReceipt | null = null;
    try {
      receipt = await this.repository.startTurn({
        roomId: contextResult.context.roomId,
        userId,
        conversationId: contextResult.context.conversationId,
        courseId: contextResult.context.courseId,
        message: cleaned.message,
        contextDigest: contextResult.digest,
        depth: cleaned.depth,
        allowGeneralKnowledge: cleaned.allowGeneral,
      });
      const rag = await this.gateway.ragChat({
        message: cleaned.message,
        mode: "explain",
        limit: this.config.maxSources,
        material_ids: contextResult.context.authorizedMaterialIds,
        context: {
          user_id: contextResult.context.userId,
          room_id: contextResult.context.roomId,
          course_id: contextResult.context.courseId,
          lesson_id: contextResult.context.lessonId,
          section_id: contextResult.context.sectionId,
          selected_text: contextResult.context.selectedText,
          permission_level: "read",
        },
      });
      if (rag.proposed_actions.length) throw new EveGroundedChatIntegrityError("Il retrieval ha proposto azioni non ammesse");
      const authorized = new Set(contextResult.context.authorizedMaterialIds);
      const citations = this.citationsFromRag(rag, authorized);

      let provider = "none";
      let model = "none";
      let modelUncertainty: EveChatUncertainty = "high";
      let structured = this.fallback(cleaned.depth, citations);
      let fallbackUsed = citations.length > 0;
      let fallbackReason: string | null = citations.length ? "provider_not_attempted" : null;

      if (citations.length || cleaned.allowGeneral) {
        try {
          const generated = await this.gateway.modelChat({
            message: this.modelPrompt(cleaned.message, cleaned.depth, cleaned.allowGeneral, citations),
            mode: "grounded-structured",
            context: {
              user_id: contextResult.context.userId,
              room_id: contextResult.context.roomId,
              course_id: contextResult.context.courseId,
              lesson_id: contextResult.context.lessonId,
              section_id: contextResult.context.sectionId,
              selected_text: contextResult.context.selectedText,
              permission_level: "read",
            },
          });
          provider = generated.provider;
          model = generated.model;
          modelUncertainty = uncertainty(generated.uncertainty);
          structured = this.parseProvider(generated, cleaned.depth, citations, cleaned.allowGeneral);
          fallbackUsed = false;
          fallbackReason = null;
        } catch (error) {
          if (!this.config.deterministicFallback || (!citations.length && cleaned.allowGeneral)) {
            throw error;
          }
          fallbackUsed = true;
          fallbackReason = error instanceof Error && "code" in error
            ? String((error as Error & { code: unknown }).code)
            : error instanceof Error ? error.name : "provider_invalid";
          provider = "local-grounded-fallback";
          model = "eve-grounded-extractive-v1";
          modelUncertainty = "high";
          structured = this.fallback(cleaned.depth, citations);
        }
      }

      const allStatements = [...structured.facts, ...structured.hypotheses, ...structured.suggestions];
      const usedIds = new Set(allStatements.flatMap((item) => item.citationIds));
      const usedCitations = citations.filter((item) => usedIds.has(item.id));
      const generalKnowledgeUsed = allStatements.some((item) => item.basis === "general");
      const grounded = usedCitations.length > 0;
      const notFound = !allStatements.length && !generalKnowledgeUsed;
      if (grounded && this.config.requireCitations && !usedCitations.length) throw new EveGroundedChatIntegrityError("Risposta grounded senza citazioni");
      if (generalKnowledgeUsed && !cleaned.allowGeneral) throw new EveGroundedChatIntegrityError("Conoscenza generale non autorizzata");
      if (notFound) {
        structured = { answer: "Non ho trovato nei materiali autorizzati informazioni sufficienti per rispondere. Non aggiungo fonti o fatti inventati.", facts: [], hypotheses: [], suggestions: [] };
      }
      const knowledgeScope = generalKnowledgeUsed ? "materials_plus_general_labeled" : "materials_only";
      const completion = await this.repository.completeTurn({
        turnId: receipt.turnId,
        roomId: contextResult.context.roomId,
        conversationId: receipt.conversationId,
        answer: structured.answer,
        facts: structured.facts,
        hypotheses: structured.hypotheses,
        suggestions: structured.suggestions,
        citations: usedCitations,
        provider,
        model,
        grounded,
        notFound,
        generalKnowledgeUsed,
        knowledgeScope,
        uncertainty: notFound ? "high" : modelUncertainty,
        fallbackUsed,
        fallbackReason,
        metadata: { retrieval_stage: rag.retrieval_stage, query_sha256: rag.query_sha256, answer_sha256: rag.answer_sha256 },
      });
      return {
        checkpoint: "CORE-2.0",
        turnId: receipt.turnId,
        conversationId: receipt.conversationId,
        userMessageId: receipt.userMessageId,
        responseMessageId: completion.responseMessageId,
        answer: structured.answer,
        facts: structured.facts,
        hypotheses: structured.hypotheses,
        suggestions: structured.suggestions,
        citations: usedCitations,
        provider,
        model,
        uncertainty: notFound ? "high" : modelUncertainty,
        grounded,
        notFound,
        generalKnowledgeUsed,
        knowledgeScope,
        depth: cleaned.depth,
        fallbackUsed,
        fallbackReason,
        contextDigest: contextResult.digest,
        memoryWritten: false,
        actionsExecuted: false,
        feedbackEnabled: this.config.feedbackEnabled,
      };
    } catch (error) {
      if (receipt) {
        const code = error instanceof Error && "code" in error ? String((error as Error & { code: unknown }).code) : "grounded_chat_failed";
        try { await this.repository.failTurn(receipt.turnId, contextResult.context.roomId, code); } catch { /* preserva errore originale */ }
      }
      if (error instanceof EveGroundedChatError) throw error;
      if (error instanceof Error && error.name.startsWith("EveContext")) throw error;
      throw new EveGroundedChatDependencyError();
    }
  }

  async openSource(userId: string, request: EveGroundedChatSourceRequest): Promise<EveGroundedChatSourceResponse> {
    if (!this.config.enabled) throw new EveGroundedChatDisabledError();
    const context = await this.contextBuilder.build(userId, {
      roomId: request.roomId,
      primaryMaterialId: request.materialId,
      authorizedMaterialIds: [request.materialId],
      scope: "private",
    });
    let opened: FastApiSourceOpenResponse;
    try {
      opened = await this.gateway.openSource({
        room_id: context.context.roomId,
        locator: request.locator,
        expected_text_sha256: request.expectedTextSha256,
        context_chars: 420,
        require_current: false,
      });
    } catch { throw new EveGroundedChatDependencyError("Apertura fonte non disponibile"); }
    if (opened.material_id !== request.materialId || opened.room_id !== request.roomId) throw new EveGroundedChatAuthorizationError("Fonte non appartenente al contesto autorizzato");
    if (!opened.integrity_verified || opened.instructions_executable) throw new EveGroundedChatIntegrityError("Integrità della fonte non verificata");
    return {
      checkpoint: "CORE-2.0",
      materialId: opened.material_id,
      title: opened.title,
      locator: opened.locator,
      text: opened.text,
      contextText: opened.context_text,
      integrityVerified: opened.integrity_verified,
      expectedHashVerified: opened.expected_hash_verified ?? null,
      stale: opened.stale,
      suspiciousContent: opened.suspicious_content,
      safetyFlags: opened.safety_flags,
      instructionsExecutable: false,
    };
  }
}
