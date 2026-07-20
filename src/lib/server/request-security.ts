import type { NextRequest } from "next/server";

/** Same-origin guard for cookie-authenticated mutating endpoints. */
export function isSameOriginRequest(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return request.headers.get("sec-fetch-site") !== "cross-site";
  try {
    const received = new URL(origin).origin;
    const configured = process.env.NEXT_PUBLIC_APP_URL
      ? new URL(process.env.NEXT_PUBLIC_APP_URL).origin
      : null;
    return received === request.nextUrl.origin || received === configured;
  } catch {
    return false;
  }
}
