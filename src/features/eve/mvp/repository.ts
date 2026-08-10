import "server-only";
import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { EveMvpCitation, EveMvpFeedbackReceipt, EveMvpFeedbackRequest } from "./contracts";
import { EveMvpPersistenceError } from "./errors";

export interface EveMvpRunStartInput {
  roomId: string;
  userId: string;
  conversationId?: string;
  courseId?: string;
  question: string;
  contextDigest: string;
}

export interface EveMvpRunReceipt {
  runId: string;
  conversationId: string;
  userMessageId: string;
}

export interface EveMvpRunCompleteInput {
  runId: string;
  roomId: string;
  conversationId: string;
  answer: string;
  citations: readonly EveMvpCitation[];
  provider: string;
  model: string;
  grounded: boolean;
  uncertainty: "low" | "medium" | "high";
  metadata: Readonly<Record<string, unknown>>;
}

export interface EveMvpRunCompletion {
  responseMessageId: string;
}

export interface EveMvpRepository {
  startRun(input: EveMvpRunStartInput): Promise<EveMvpRunReceipt>;
  completeRun(input: EveMvpRunCompleteInput): Promise<EveMvpRunCompletion>;
  failRun(runId: string, roomId: string, errorCode: string): Promise<void>;
  recordFeedback(userId: string, request: EveMvpFeedbackRequest): Promise<EveMvpFeedbackReceipt>;
}

const titleFromQuestion = (question: string): string => {
  const cleaned = question.replace(/\s+/g, " ").trim();
  return cleaned.length <= 80 ? cleaned : `${cleaned.slice(0, 77)}…`;
};

export class SupabaseEveMvpRepository implements EveMvpRepository {
  constructor(private readonly client: SupabaseClient) {}

  async startRun(input: EveMvpRunStartInput): Promise<EveMvpRunReceipt> {
    let conversationId = input.conversationId;
    if (!conversationId) {
      const conversation = await this.client
        .from("eve_conversations")
        .insert({
          room_id: input.roomId,
          course_id: input.courseId ?? null,
          owner_id: input.userId,
          title: titleFromQuestion(input.question),
          status: "active",
        })
        .select("id")
        .single();
      if (conversation.error || !conversation.data) {
        throw new EveMvpPersistenceError("Creazione conversazione non riuscita");
      }
      conversationId = String(conversation.data.id);
    }

    const userMessage = await this.client
      .from("eve_messages")
      .insert({
        conversation_id: conversationId,
        room_id: input.roomId,
        author_id: input.userId,
        role: "user",
        content: input.question,
        citations: [],
        model_metadata: { checkpoint: "CORE-1.7", context_digest: input.contextDigest },
      })
      .select("id")
      .single();
    if (userMessage.error || !userMessage.data) {
      throw new EveMvpPersistenceError("Persistenza domanda non riuscita");
    }

    const run = await this.client
      .from("eve_mvp_runs")
      .insert({
        room_id: input.roomId,
        actor_id: input.userId,
        conversation_id: conversationId,
        user_message_id: userMessage.data.id,
        context_digest: input.contextDigest,
        question_sha256: createHash("sha256").update(input.question, "utf8").digest("hex"),
        status: "running",
      })
      .select("id")
      .single();
    if (run.error || !run.data) {
      throw new EveMvpPersistenceError("Creazione traccia MVP non riuscita");
    }
    return {
      runId: String(run.data.id),
      conversationId,
      userMessageId: String(userMessage.data.id),
    };
  }

  async completeRun(input: EveMvpRunCompleteInput): Promise<EveMvpRunCompletion> {
    const assistant = await this.client
      .from("eve_messages")
      .insert({
        conversation_id: input.conversationId,
        room_id: input.roomId,
        author_id: null,
        role: "assistant",
        content: input.answer,
        citations: input.citations,
        model_metadata: {
          checkpoint: "CORE-1.7",
          provider: input.provider,
          model: input.model,
          grounded: input.grounded,
          uncertainty: input.uncertainty,
          memory_written: false,
          actions_executed: false,
          ...input.metadata,
        },
      })
      .select("id")
      .single();
    if (assistant.error || !assistant.data) {
      throw new EveMvpPersistenceError("Persistenza risposta non riuscita");
    }
    const updated = await this.client
      .from("eve_mvp_runs")
      .update({
        assistant_message_id: assistant.data.id,
        status: "completed",
        provider: input.provider,
        model: input.model,
        grounded: input.grounded,
        uncertainty: input.uncertainty,
        source_count: input.citations.length,
        error_code: null,
        completed_at: new Date().toISOString(),
      })
      .eq("id", input.runId)
      .eq("room_id", input.roomId);
    if (updated.error) throw new EveMvpPersistenceError("Chiusura traccia MVP non riuscita");
    return { responseMessageId: String(assistant.data.id) };
  }

  async failRun(runId: string, roomId: string, errorCode: string): Promise<void> {
    const result = await this.client
      .from("eve_mvp_runs")
      .update({
        status: "failed",
        error_code: errorCode.slice(0, 160),
        completed_at: new Date().toISOString(),
      })
      .eq("id", runId)
      .eq("room_id", roomId);
    if (result.error) throw new EveMvpPersistenceError("Registrazione errore MVP non riuscita");
  }

  async recordFeedback(
    userId: string,
    request: EveMvpFeedbackRequest,
  ): Promise<EveMvpFeedbackReceipt> {
    const result = await this.client
      .from("eve_response_feedback")
      .upsert(
        {
          room_id: request.roomId,
          conversation_id: request.conversationId,
          response_message_id: request.responseMessageId,
          user_id: userId,
          rating: request.rating,
          note: request.note?.trim() || null,
        },
        { onConflict: "response_message_id,user_id" },
      )
      .select("id,updated_at")
      .single();
    if (result.error || !result.data) {
      throw new EveMvpPersistenceError("Salvataggio feedback non riuscito");
    }
    return {
      feedbackId: String(result.data.id),
      updatedAt: String(result.data.updated_at),
    };
  }
}
