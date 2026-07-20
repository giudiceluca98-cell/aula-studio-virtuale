import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/webhooks/study-update/route";
import {
  resetWebhookRateLimitForTests,
  WEBHOOK_RATE_LIMIT,
} from "@/lib/webhook/rate-limit";
import { WEBHOOK_MAX_BODY_BYTES } from "@/lib/webhook/raw-body";
import { createWebhookSignature, verifyWebhookSignature } from "@/lib/webhook/signature";
import {
  getWebhookEventsForTests,
  resetWebhookEventStoreForTests,
} from "@/lib/webhook/store";

const SECRET = "test-webhook-secret-with-at-least-32-bytes";
const BASE_PAYLOAD = {
  event: "progress_updated",
  eventId: "11111111-1111-4111-8111-111111111111",
  roomId: "22222222-2222-4222-8222-222222222222",
  userId: "33333333-3333-4333-8333-333333333333",
  timestamp: "2026-07-17T14:30:00Z",
  data: {
    course: "Python for Everybody",
    chapter: 1,
    lesson: "Why Program?",
    progressPercentage: 20,
    studyMinutes: 45,
    exercisesCompleted: 3,
  },
} as const;

function signedRequest(rawBody: string, signatureBody = rawBody): Request {
  return new Request("http://localhost/api/webhooks/study-update", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-real-ip": "127.0.0.1",
      "x-webhook-signature": createWebhookSignature(signatureBody, SECRET),
    },
    body: rawBody,
  });
}

describe("POST /api/webhooks/study-update", () => {
  beforeEach(() => {
    vi.stubEnv("WEBHOOK_SECRET", SECRET);
    vi.stubEnv("WEBHOOK_TEST_USE_SUPABASE", "0");
    resetWebhookEventStoreForTests();
    resetWebhookRateLimitForTests();
  });

  it("accepts a correctly signed raw payload and durably queues it", async () => {
    const response = await POST(signedRequest(JSON.stringify(BASE_PAYLOAD)));

    expect(response.status).toBe(202);
    expect(await response.json()).toMatchObject({
      accepted: true,
      duplicate: false,
      eventId: BASE_PAYLOAD.eventId,
    });
    expect(getWebhookEventsForTests().size).toBe(1);
  });

  it("checks the exact raw bytes rather than a re-serialized object", async () => {
    const compact = JSON.stringify(BASE_PAYLOAD);
    const differentlyFormatted = JSON.stringify(BASE_PAYLOAD, null, 2);
    const response = await POST(signedRequest(differentlyFormatted, compact));

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ error: "invalid_signature" });
    expect(getWebhookEventsForTests().size).toBe(0);
  });

  it("rejects a missing or malformed signature", async () => {
    const body = JSON.stringify(BASE_PAYLOAD);
    const request = new Request("http://localhost/api/webhooks/study-update", {
      method: "POST",
      headers: { "content-type": "application/json", "x-real-ip": "127.0.0.2" },
      body,
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
    expect(getWebhookEventsForTests().size).toBe(0);
  });

  it("does not enqueue the same eventId twice", async () => {
    const body = JSON.stringify(BASE_PAYLOAD);
    const first = await POST(signedRequest(body));
    const second = await POST(signedRequest(body));

    expect(first.status).toBe(202);
    expect(second.status).toBe(200);
    expect(await second.json()).toMatchObject({ accepted: true, duplicate: true });
    expect(getWebhookEventsForTests().size).toBe(1);
  });

  it("validates signed payloads with Zod", async () => {
    const invalidPayload = {
      ...BASE_PAYLOAD,
      data: { ...BASE_PAYLOAD.data, progressPercentage: 140 },
    };
    const response = await POST(signedRequest(JSON.stringify(invalidPayload)));

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: "invalid_payload" });
    expect(getWebhookEventsForTests().size).toBe(0);
  });

  it("rejects oversized requests before parsing them", async () => {
    const request = new Request("http://localhost/api/webhooks/study-update", {
      method: "POST",
      headers: {
        "content-length": String(WEBHOOK_MAX_BODY_BYTES + 1),
        "x-real-ip": "127.0.0.3",
        "x-webhook-signature": "sha256=" + "0".repeat(64),
      },
      body: "{}",
    });
    const response = await POST(request);

    expect(response.status).toBe(413);
    expect(await response.json()).toMatchObject({ error: "payload_too_large" });
  });

  it("rate limits repeated attempts from one client", async () => {
    const body = JSON.stringify(BASE_PAYLOAD);
    for (let attempt = 0; attempt < WEBHOOK_RATE_LIMIT.maxRequests; attempt += 1) {
      const response = await POST(
        new Request("http://localhost/api/webhooks/study-update", {
          method: "POST",
          headers: {
            "x-real-ip": "192.0.2.50",
            "x-webhook-signature": "sha256=" + "0".repeat(64),
          },
          body,
        }),
      );
      expect(response.status).toBe(401);
    }

    const limited = await POST(
      new Request("http://localhost/api/webhooks/study-update", {
        method: "POST",
        headers: {
          "x-real-ip": "192.0.2.50",
          "x-webhook-signature": "sha256=" + "0".repeat(64),
        },
        body,
      }),
    );

    expect(limited.status).toBe(429);
    expect(limited.headers.get("retry-after")).toBeTruthy();
  });
});

describe("webhook signature helpers", () => {
  it("accepts a valid SHA-256 HMAC and rejects altered bytes", () => {
    const body = '{"ok":true}';
    const signature = createWebhookSignature(body, SECRET);

    expect(verifyWebhookSignature(body, signature, SECRET)).toBe(true);
    expect(verifyWebhookSignature(`${body} `, signature, SECRET)).toBe(false);
    expect(verifyWebhookSignature(body, "sha256=xyz", SECRET)).toBe(false);
  });
});
