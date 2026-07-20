import { createHmac, timingSafeEqual } from "node:crypto";

const SIGNATURE_PATTERN = /^sha256=([a-fA-F0-9]{64})$/;

export function createWebhookSignature(
  rawBody: Uint8Array | string,
  secret: string,
): string {
  const digest = createHmac("sha256", secret).update(rawBody).digest("hex");
  return `sha256=${digest}`;
}

/**
 * Compares two fixed-size SHA-256 digests. The format check happens first so
 * timingSafeEqual is never called with differently sized buffers.
 */
export function verifyWebhookSignature(
  rawBody: Uint8Array | string,
  signatureHeader: string | null,
  secret: string,
): boolean {
  if (!signatureHeader) return false;

  const match = SIGNATURE_PATTERN.exec(signatureHeader.trim());
  if (!match) return false;

  const suppliedDigest = Buffer.from(match[1], "hex");
  const expectedDigest = createHmac("sha256", secret)
    .update(rawBody)
    .digest();

  return timingSafeEqual(suppliedDigest, expectedDigest);
}
