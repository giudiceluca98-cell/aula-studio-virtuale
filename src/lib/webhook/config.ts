import { Buffer } from "node:buffer";

export class WebhookConfigurationError extends Error {
  constructor(readonly code: "missing_secret" | "weak_secret") {
    super("Webhook configuration is invalid");
    this.name = "WebhookConfigurationError";
  }
}

/** Server-only value: this module must only be imported from route handlers. */
export function getWebhookSecret(): string {
  const secret = process.env.WEBHOOK_SECRET;

  if (!secret) {
    throw new WebhookConfigurationError("missing_secret");
  }

  if (Buffer.byteLength(secret, "utf8") < 32) {
    throw new WebhookConfigurationError("weak_secret");
  }

  return secret;
}
