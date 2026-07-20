export const WEBHOOK_MAX_BODY_BYTES = 64 * 1_024;

export class WebhookPayloadTooLargeError extends Error {
  constructor() {
    super("Webhook payload exceeds the configured limit");
    this.name = "WebhookPayloadTooLargeError";
  }
}

export async function readRawBody(
  request: Request,
  maxBytes = WEBHOOK_MAX_BODY_BYTES,
): Promise<Uint8Array> {
  const contentLength = request.headers.get("content-length");
  if (contentLength && /^\d+$/.test(contentLength)) {
    if (Number(contentLength) > maxBytes) {
      throw new WebhookPayloadTooLargeError();
    }
  }

  if (!request.body) return new Uint8Array();

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        throw new WebhookPayloadTooLargeError();
      }

      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const result = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return result;
}
