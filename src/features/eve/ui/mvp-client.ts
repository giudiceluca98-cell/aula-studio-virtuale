"use client";

import type {
  EveMvpFeedbackRating,
  EveMvpRunRequest,
  EveMvpRunResponse,
  EveMvpSourceOpenResponse,
} from "../mvp/contracts";

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({ error: "invalid_response" }));
  if (!response.ok) {
    const detail = typeof data?.detail === "string" ? data.detail : "Eve non disponibile";
    throw new Error(detail);
  }
  return data as T;
}

export function runEveMvp(request: EveMvpRunRequest): Promise<EveMvpRunResponse> {
  return postJson("/api/eve/mvp", request);
}

export function openEveMvpSource(request: {
  roomId: string;
  materialId: string;
  locator: string;
  expectedTextSha256?: string;
}): Promise<EveMvpSourceOpenResponse> {
  return postJson("/api/eve/mvp/source", request);
}

export function sendEveMvpFeedback(request: {
  roomId: string;
  conversationId: string;
  responseMessageId: string;
  rating: EveMvpFeedbackRating;
}): Promise<{ feedbackId: string; updatedAt: string }> {
  return postJson("/api/eve/mvp/feedback", request);
}
