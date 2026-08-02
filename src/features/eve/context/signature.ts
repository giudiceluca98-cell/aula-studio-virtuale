import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { EveAuthorizedContext } from "../contracts";
import { EveContextIntegrityError } from "./errors";

const stableValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entry]) => entry !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, stableValue(entry)]),
    );
  }
  return value;
};

export function canonicalizeContext(context: EveAuthorizedContext): string {
  return JSON.stringify(stableValue(context));
}

export function digestAuthorizedContext(context: EveAuthorizedContext): string {
  return createHash("sha256").update(canonicalizeContext(context), "utf8").digest("hex");
}

const encode = (value: string | Buffer): string => Buffer.from(value).toString("base64url");
const signatureFor = (payload: string, secret: string): Buffer =>
  createHmac("sha256", secret).update(payload, "utf8").digest();

export function signAuthorizedContext(
  context: EveAuthorizedContext,
  secret: string,
): { token: string; digest: string } {
  const payload = encode(canonicalizeContext(context));
  const signature = encode(signatureFor(payload, secret));
  return { token: `${payload}.${signature}`, digest: digestAuthorizedContext(context) };
}

export function verifyAuthorizedContextToken(
  token: string,
  secret: string,
  now = new Date(),
): EveAuthorizedContext {
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra !== undefined) throw new EveContextIntegrityError();
  const observed = Buffer.from(signature, "base64url");
  const expected = signatureFor(payload, secret);
  if (observed.length !== expected.length || !timingSafeEqual(observed, expected)) {
    throw new EveContextIntegrityError();
  }
  let context: EveAuthorizedContext;
  try {
    context = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as EveAuthorizedContext;
  } catch {
    throw new EveContextIntegrityError("Payload del contesto non leggibile");
  }
  if (context.version !== "1.4" || context.checkpoint !== "CORE-1.4") {
    throw new EveContextIntegrityError("Versione del contesto non supportata");
  }
  const expiresAt = Date.parse(context.expiresAt);
  if (!Number.isFinite(expiresAt) || expiresAt <= now.getTime()) {
    throw new EveContextIntegrityError("Contesto scaduto");
  }
  return context;
}
