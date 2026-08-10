"use client";
import type {
  EveGroundedChatRequest,
  EveGroundedChatResponse,
  EveGroundedChatSourceRequest,
  EveGroundedChatSourceResponse,
} from "../chat/contracts";
import type { EveMvpFeedbackRating } from "../mvp/contracts";

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({ error: "invalid_response" }));
  if (!response.ok) throw new Error(typeof data?.detail === "string" ? data.detail : "Eve non disponibile");
  return data as T;
}
export const runEveGroundedChat = (request: EveGroundedChatRequest): Promise<EveGroundedChatResponse> => postJson("/api/eve/chat", request);
export const openEveGroundedChatSource = (request: EveGroundedChatSourceRequest): Promise<EveGroundedChatSourceResponse> => postJson("/api/eve/chat/source", request);
export const sendEveGroundedChatFeedback = (request: {
  roomId: string; conversationId: string; responseMessageId: string; rating: EveMvpFeedbackRating;
}): Promise<{ feedbackId: string; updatedAt: string }> => postJson("/api/eve/mvp/feedback", request);
