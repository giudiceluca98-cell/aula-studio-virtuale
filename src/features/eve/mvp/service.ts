import "server-only";
import type { EveContextBuilder } from "../context/builder";
import type {
  FastApiRagChatRequest,
  FastApiRagChatResponse,
  FastApiSourceOpenRequest,
  FastApiSourceOpenResponse,
} from "../adapters/fastapi/contracts";
import type { EveMvpConfig } from "./config";
import type {
  EveMvpCitation,
  EveMvpRunRequest,
  EveMvpRunResponse,
  EveMvpSourceOpenRequest,
  EveMvpSourceOpenResponse,
} from "./contracts";
import {
  EveMvpAuthorizationError,
  EveMvpDependencyError,
  EveMvpDisabledError,
  EveMvpIntegrityError,
  EveMvpError,
  EveMvpValidationError,
} from "./errors";
import type { EveMvpRepository, EveMvpRunReceipt } from "./repository";

export interface EveMvpGateway {
  ragChat(request: FastApiRagChatRequest): Promise<FastApiRagChatResponse>;
  openSource(request: FastApiSourceOpenRequest): Promise<FastApiSourceOpenResponse>;
}

const uncertainty = (value: string): "low" | "medium" | "high" => {
  if (value === "low" || value === "medium" || value === "high") return value;
  return "high";
};

export class EveMvpService {
  constructor(
    private readonly contextBuilder: EveContextBuilder,
    private readonly gateway: EveMvpGateway,
    private readonly repository: EveMvpRepository,
    private readonly config: EveMvpConfig,
  ) {}

  private cleanQuestion(question: string): string {
    const value = question.trim();
    if (!value) throw new EveMvpValidationError("La domanda è obbligatoria");
    if (value.length > this.config.maxQuestionChars) {
      throw new EveMvpValidationError("La domanda supera il limite configurato");
    }
    return value;
  }

  async run(userId: string, request: EveMvpRunRequest): Promise<EveMvpRunResponse> {
    if (!this.config.enabled) throw new EveMvpDisabledError();
    const question = this.cleanQuestion(request.question);
    const contextResult = await this.contextBuilder.build(userId, request);
    let receipt: EveMvpRunReceipt | null = null;
    try {
      receipt = await this.repository.startRun({
        roomId: contextResult.context.roomId,
        userId,
        conversationId: contextResult.context.conversationId,
        courseId: contextResult.context.courseId,
        question,
        contextDigest: contextResult.digest,
      });
      const result = await this.gateway.ragChat({
        message: question,
        mode: request.mode?.trim() || "explain",
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
      if (result.proposed_actions.length > 0) {
        throw new EveMvpIntegrityError("La risposta contiene azioni non ammesse dal Gate MVP");
      }
      const authorized = new Set(contextResult.context.authorizedMaterialIds);
      const citations: EveMvpCitation[] = result.sources.map((source) => {
        const citation = source.citation;
        if (!authorized.has(citation.material_id)) {
          throw new EveMvpAuthorizationError("Citazione riferita a un materiale non autorizzato");
        }
        if (!citation.locator || !/^[^:]+:\d+-\d+$/.test(citation.locator)) {
          throw new EveMvpIntegrityError("Citazione priva di locator verificabile");
        }
        if (!/^[0-9a-f]{64}$/.test(citation.text_sha256)) {
          throw new EveMvpIntegrityError("Citazione priva di SHA-256 verificabile");
        }
        return {
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
      if (result.grounded && this.config.requireCitations && citations.length === 0) {
        throw new EveMvpIntegrityError("Risposta grounded senza citazioni");
      }
      const resolvedUncertainty = uncertainty(result.uncertainty);
      if (!result.grounded && citations.length > 0) {
        throw new EveMvpIntegrityError("Risposta non grounded con citazioni incoerenti");
      }
      const completion = await this.repository.completeRun({
        runId: receipt.runId,
        roomId: contextResult.context.roomId,
        conversationId: receipt.conversationId,
        answer: result.message,
        citations,
        provider: result.provider,
        model: result.model,
        grounded: result.grounded,
        uncertainty: resolvedUncertainty,
        metadata: {
          retrieval_stage: result.retrieval_stage,
          query_sha256: result.query_sha256,
          answer_sha256: result.answer_sha256,
          integrity_failures: result.integrity_failures,
          excluded_suspicious_hits: result.excluded_suspicious_hits,
        },
      });
      return {
        checkpoint: "CORE-1.7",
        runId: receipt.runId,
        conversationId: receipt.conversationId,
        userMessageId: receipt.userMessageId,
        responseMessageId: completion.responseMessageId,
        answer: result.message,
        provider: result.provider,
        model: result.model,
        uncertainty: resolvedUncertainty,
        grounded: result.grounded,
        retrievalStage: result.retrieval_stage,
        citations,
        contextDigest: contextResult.digest,
        memoryWritten: false,
        actionsExecuted: false,
        feedbackEnabled: this.config.feedbackEnabled,
      };
    } catch (error) {
      if (receipt) {
        const code = error instanceof Error && "code" in error
          ? String((error as Error & { code: unknown }).code)
          : "mvp_execution_failed";
        try { await this.repository.failRun(receipt.runId, contextResult.context.roomId, code); }
        catch { /* non sostituire l'errore originale */ }
      }
      if (error instanceof EveMvpError) throw error;
      if (error instanceof Error && error.name.startsWith("EveContext")) throw error;
      throw new EveMvpDependencyError();
    }
  }

  async openSource(
    userId: string,
    request: EveMvpSourceOpenRequest,
  ): Promise<EveMvpSourceOpenResponse> {
    if (!this.config.enabled) throw new EveMvpDisabledError();
    const contextResult = await this.contextBuilder.build(userId, {
      roomId: request.roomId,
      primaryMaterialId: request.materialId,
      authorizedMaterialIds: [request.materialId],
    });
    let opened: FastApiSourceOpenResponse;
    try {
      opened = await this.gateway.openSource({
        room_id: contextResult.context.roomId,
        locator: request.locator,
        expected_text_sha256: request.expectedTextSha256,
        context_chars: 320,
        require_current: false,
      });
    } catch (error) {
      if (error instanceof EveMvpError) throw error;
      if (error instanceof Error && error.name.startsWith("EveContext")) throw error;
      throw new EveMvpDependencyError("Apertura fonte non disponibile");
    }
    if (opened.material_id !== request.materialId || opened.room_id !== request.roomId) {
      throw new EveMvpAuthorizationError("La fonte aperta non appartiene al contesto autorizzato");
    }
    if (!opened.integrity_verified || opened.instructions_executable) {
      throw new EveMvpIntegrityError("Integrità della fonte non verificata");
    }
    return {
      checkpoint: "CORE-1.7",
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
