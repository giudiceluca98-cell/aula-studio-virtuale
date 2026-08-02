import { NextResponse } from "next/server";
import { readExternalProviderStatus } from "@/features/eve/agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(readExternalProviderStatus(), {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
