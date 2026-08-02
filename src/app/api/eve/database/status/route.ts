import { NextResponse } from "next/server";
import { readEveDatabaseStatus } from "@/features/eve/data/status";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  return NextResponse.json(await readEveDatabaseStatus(), { headers: { "Cache-Control": "no-store" } });
}
