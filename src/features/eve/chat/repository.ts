import "server-only";
import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  EveChatDepth,
  EveChatUncertainty,
  EveGroundedCitation,
  EveGroundedStatement,
} from "./contracts";
import { EveGroundedChatPersistenceError } from "./errors";

export interface EveGroundedTurnStartInput {
  roomId: string;
  userId: string;
  conversationId?: string;
  courseId?: string;
  message: string;
  contextDigest: string;
  depth: EveChatDepth;
  allowGeneralKnowledge: boolean;
}
export interface EveGroundedTurnReceipt {
  turnId: string;
  conversationId: string;
  userMessageId: string;
}
export interface EveGroundedTurnCompleteInput {
  turnId: string;
  roomId: string;
  conversationId: string;
  answer: string;
  facts: readonly EveGroundedStatement[];
  hypotheses: readonly EveGroundedStatement[];
  suggestions: readonly EveGroundedStatement[];
  citations: readonly EveGroundedCitation[];
  provider: string;
  model: string;
  grounded: boolean;
  notFound: boolean;
  generalKnowledgeUsed: boolean;
  knowledgeScope: string;
  uncertainty: EveChatUncertainty;
  fallbackUsed: boolean;
  fallbackReason: string | null;
  metadata: Readonly<Record<string, unknown>>;
}
export interface EveGroundedTurnCompletion { responseMessageId: string; }
export interface EveGroundedChatRepository {
  startTurn(input: EveGroundedTurnStartInput): Promise<EveGroundedTurnReceipt>;
  completeTurn(input: EveGroundedTurnCompleteInput): Promise<EveGroundedTurnCompletion>;
  failTurn(turnId: string, roomId: string, errorCode: string): Promise<void>;
}

const titleFromMessage = (message: string): string => {
  const value = message.replace(/\s+/g, " ").trim();
  return value.length <= 80 ? value : `${value.slice(0, 77)}…`;
};

export class SupabaseEveGroundedChatRepository implements EveGroundedChatRepository {
  constructor(
    private readonly client: SupabaseClient,
    private readonly persistenceClient: SupabaseClient = client,
  ) {}

  async startTurn(input: EveGroundedTurnStartInput): Promise<EveGroundedTurnReceipt> {
    let conversationId = input.conversationId;
    if (!conversationId) {
      const created = await this.client.from("eve_conversations").insert({
        room_id: input.roomId,
        course_id: input.courseId ?? null,
        owner_id: input.userId,
        title: titleFromMessage(input.message),
        status: "active",
      }).select("id").single();
      if (created.error || !created.data) throw new EveGroundedChatPersistenceError("Creazione conversazione privata non riuscita");
      conversationId = String(created.data.id);
    }

    const userMessage = await this.client.from("eve_messages").insert({
      conversation_id: conversationId,
      room_id: input.roomId,
      author_id: input.userId,
      role: "user",
      content: input.message,
      citations: [],
      model_metadata: {
        checkpoint: "CORE-2.0",
        context_digest: input.contextDigest,
        depth: input.depth,
        allow_general_knowledge: input.allowGeneralKnowledge,
        scope: "private",
      },
    }).select("id").single();
    if (userMessage.error || !userMessage.data) throw new EveGroundedChatPersistenceError("Persistenza messaggio utente non riuscita");

    const turn = await this.client.from("eve_grounded_chat_turns").insert({
      room_id: input.roomId,
      actor_id: input.userId,
      conversation_id: conversationId,
      user_message_id: userMessage.data.id,
      context_digest: input.contextDigest,
      message_sha256: createHash("sha256").update(input.message, "utf8").digest("hex"),
      depth: input.depth,
      allow_general_knowledge: input.allowGeneralKnowledge,
      status: "running",
    }).select("id").single();
    if (turn.error || !turn.data) throw new EveGroundedChatPersistenceError("Creazione turno grounded non riuscita");
    return { turnId: String(turn.data.id), conversationId, userMessageId: String(userMessage.data.id) };
  }

  async completeTurn(input: EveGroundedTurnCompleteInput): Promise<EveGroundedTurnCompletion> {
    const assistant = await this.persistenceClient.from("eve_messages").insert({
      conversation_id: input.conversationId,
      room_id: input.roomId,
      author_id: null,
      role: "assistant",
      content: input.answer,
      citations: input.citations,
      model_metadata: {
        checkpoint: "CORE-2.0",
        provider: input.provider,
        model: input.model,
        grounded: input.grounded,
        not_found: input.notFound,
        general_knowledge_used: input.generalKnowledgeUsed,
        knowledge_scope: input.knowledgeScope,
        uncertainty: input.uncertainty,
        facts: input.facts,
        hypotheses: input.hypotheses,
        suggestions: input.suggestions,
        fallback_used: input.fallbackUsed,
        fallback_reason: input.fallbackReason,
        memory_written: false,
        actions_executed: false,
        ...input.metadata,
      },
    }).select("id").single();
    if (assistant.error || !assistant.data) throw new EveGroundedChatPersistenceError("Persistenza risposta grounded non riuscita");

    const updated = await this.persistenceClient.from("eve_grounded_chat_turns").update({
      assistant_message_id: assistant.data.id,
      status: "completed",
      provider: input.provider,
      model: input.model,
      grounded: input.grounded,
      not_found: input.notFound,
      general_knowledge_used: input.generalKnowledgeUsed,
      knowledge_scope: input.knowledgeScope,
      uncertainty: input.uncertainty,
      facts_count: input.facts.length,
      hypotheses_count: input.hypotheses.length,
      suggestions_count: input.suggestions.length,
      source_count: input.citations.length,
      fallback_used: input.fallbackUsed,
      fallback_reason: input.fallbackReason,
      completed_at: new Date().toISOString(),
      error_code: null,
    }).eq("id", input.turnId).eq("room_id", input.roomId).select("id").single();
    if (updated.error || !updated.data) throw new EveGroundedChatPersistenceError("Completamento turno grounded non riuscito");
    return { responseMessageId: String(assistant.data.id) };
  }

  async failTurn(turnId: string, roomId: string, errorCode: string): Promise<void> {
    const result = await this.persistenceClient.from("eve_grounded_chat_turns").update({
      status: "failed",
      error_code: errorCode.slice(0, 160),
      completed_at: new Date().toISOString(),
    }).eq("id", turnId).eq("room_id", roomId);
    if (result.error) throw new EveGroundedChatPersistenceError("Traccia fallimento non salvata");
  }
}
