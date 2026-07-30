import { NextResponse } from "next/server";
import { composeEveStatus } from "@/features/eve/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const status = await composeEveStatus();
  return NextResponse.json(status, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
