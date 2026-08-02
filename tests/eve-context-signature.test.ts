import { describe, expect, it } from "vitest";
import type { EveAuthorizedContext } from "@/features/eve/contracts";
import { signAuthorizedContext, verifyAuthorizedContextToken } from "@/features/eve/context/signature";

const context: EveAuthorizedContext = {
  version: "1.4", checkpoint: "CORE-1.4", userId: "user-1", roomId: "room-1",
  roles: ["student"], scope: "private", authorizedMaterialIds: ["material-1"],
  issuedAt: "2026-07-30T00:00:00.000Z", expiresAt: "2026-07-30T00:05:00.000Z", nonce: "nonce-1",
};
const secret = "0123456789abcdef0123456789abcdef";

describe("CORE-1.4 firma contesto", () => {
  it("firma e verifica un contesto non scaduto", () => {
    const signed = signAuthorizedContext(context, secret);
    expect(signed.digest).toMatch(/^[0-9a-f]{64}$/);
    expect(verifyAuthorizedContextToken(signed.token, secret, new Date("2026-07-30T00:01:00Z"))).toEqual(context);
  });
  it("rifiuta alterazione e scadenza", () => {
    const signed = signAuthorizedContext(context, secret);
    expect(() => verifyAuthorizedContextToken(`${signed.token}x`, secret, new Date("2026-07-30T00:01:00Z"))).toThrow();
    expect(() => verifyAuthorizedContextToken(signed.token, secret, new Date("2026-07-30T00:06:00Z"))).toThrow("scaduto");
  });
});
