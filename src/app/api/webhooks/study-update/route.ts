import { randomUUID } from "node:crypto";

import { getWebhookSecret, WebhookConfigurationError } from "@/lib/webhook/config";
import {
  consumeWebhookRateLimit,
  getWebhookClientKey,
  type RateLimitResult,
} from "@/lib/webhook/rate-limit";
import {
  readRawBody,
  WebhookPayloadTooLargeError,
} from "@/lib/webhook/raw-body";
import { webhookPayloadSchema } from "@/lib/webhook/schema";
import { verifyWebhookSignature } from "@/lib/webhook/signature";
import {
  enqueueWebhookEvent,
  WebhookEventStoreError,
} from "@/lib/webhook/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const JSON_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "Content-Type": "application/json; charset=utf-8",
};

function json(body: unknown, status: number, headers?: HeadersInit): Response {
  const responseHeaders = new Headers(JSON_HEADERS);
  if (headers) {
    new Headers(headers).forEach((value, key) => responseHeaders.set(key, value));
  }

  return Response.json(body, {
    status,
    headers: responseHeaders,
  });
}

function rateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    ...(result.allowed
      ? {}
      : { "Retry-After": String(result.retryAfterSeconds) }),
  };
}

function logServerError(
  requestId: string,
  code: "configuration" | "event_store" | "unexpected",
): void {
  // Deliberately omit headers, raw bodies, payloads, environment values and
  // error objects: any of those could contain a signature or secret.
  console.error(
    JSON.stringify({
      scope: "study-update-webhook",
      requestId,
      code,
    }),
  );
}

export async function POST(request: Request): Promise<Response> {
  const requestId = randomUUID();
  const rateLimit = consumeWebhookRateLimit(getWebhookClientKey(request));

  if (!rateLimit.allowed) {
    return json(
      { error: "rate_limit_exceeded", requestId },
      429,
      rateLimitHeaders(rateLimit),
    );
  }

  let secret: string;
  try {
    secret = getWebhookSecret();
  } catch (error) {
    if (error instanceof WebhookConfigurationError) {
      logServerError(requestId, "configuration");
      return json(
        { error: "service_unavailable", requestId },
        503,
        rateLimitHeaders(rateLimit),
      );
    }
    throw error;
  }

  let rawBody: Uint8Array;
  try {
    rawBody = await readRawBody(request);
  } catch (error) {
    if (error instanceof WebhookPayloadTooLargeError) {
      return json(
        { error: "payload_too_large", requestId },
        413,
        rateLimitHeaders(rateLimit),
      );
    }
    return json(
      { error: "invalid_body", requestId },
      400,
      rateLimitHeaders(rateLimit),
    );
  }

  const signature = request.headers.get("x-webhook-signature");
  if (!verifyWebhookSignature(rawBody, signature, secret)) {
    return json(
      { error: "invalid_signature", requestId },
      401,
      rateLimitHeaders(rateLimit),
    );
  }

  let decoded: unknown;
  try {
    decoded = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(rawBody));
  } catch {
    return json(
      { error: "invalid_json", requestId },
      400,
      rateLimitHeaders(rateLimit),
    );
  }

  const parsed = webhookPayloadSchema.safeParse(decoded);
  if (!parsed.success) {
    return json(
      {
        error: "invalid_payload",
        requestId,
        issues: parsed.error.issues.slice(0, 8).map((issue) => ({
          path: issue.path.join("."),
          code: issue.code,
          message: issue.message,
        })),
      },
      400,
      rateLimitHeaders(rateLimit),
    );
  }

  try {
    const queued = await enqueueWebhookEvent(parsed.data);
    if (queued.outcome === "duplicate") {
      // A successful 2xx prevents a correctly signed retry from looping.
      return json(
        {
          accepted: true,
          duplicate: true,
          eventId: parsed.data.eventId,
          requestId,
        },
        200,
        rateLimitHeaders(rateLimit),
      );
    }

    // 202 is intentional: validation and durable enqueue are complete; any
    // heavier domain work consumes the persisted `received` event later.
    return json(
      {
        accepted: true,
        duplicate: false,
        eventId: parsed.data.eventId,
        requestId,
      },
      202,
      rateLimitHeaders(rateLimit),
    );
  } catch (error) {
    if (error instanceof WebhookEventStoreError) {
      logServerError(requestId, "event_store");
      return json(
        { error: "service_unavailable", requestId },
        503,
        rateLimitHeaders(rateLimit),
      );
    }

    logServerError(requestId, "unexpected");
    return json(
      { error: "internal_error", requestId },
      500,
      rateLimitHeaders(rateLimit),
    );
  }
}
