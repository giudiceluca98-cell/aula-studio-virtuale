import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { parseCleanupJobs, roomContentIdSchema } from "@/lib/room-content-removal";
import { isSameOriginRequest } from "@/lib/server/request-security";
import { processRoomContentCleanupJobs } from "@/lib/server/room-content-cleanup";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

async function context(params: Promise<{ roomId: string; materialId: string }>) {
  const values = await params;
  if (!roomContentIdSchema.safeParse(values.roomId).success || !roomContentIdSchema.safeParse(values.materialId).success) return null;
  return values;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ roomId: string; materialId: string }> }) {
  const values = await context(params);
  if (!values) return json({ error: "invalid_resource" }, 400);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ error: "not_authenticated" }, 401);
  const { data, error } = await supabase.rpc("get_material_removal_impact", { p_material_id: values.materialId, p_room_id: values.roomId });
  if (error) return json({ error: error.code === "42501" ? "not_authorized" : "impact_failed" }, error.code === "42501" ? 403 : 409);
  return json({ impact: data });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ roomId: string; materialId: string }> }) {
  if (!isSameOriginRequest(request)) return json({ error: "origin_not_allowed" }, 403);
  const values = await context(params);
  if (!values) return json({ error: "invalid_resource" }, 400);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ error: "not_authenticated" }, 401);
  const { data, error } = await supabase.rpc("remove_room_material", { p_material_id: values.materialId, p_room_id: values.roomId });
  if (error) return json({ error: error.code === "42501" ? "not_authorized" : "remove_failed" }, error.code === "42501" ? 403 : 409);

  const jobs = parseCleanupJobs((data as Record<string, unknown> | null)?.cleanup_jobs);
  let cleanup = { removed: 0, pending: jobs.length };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (jobs.length && url && secret) {
    const admin = createAdminClient(url, secret, { auth: { autoRefreshToken: false, persistSession: false } });
    cleanup = await processRoomContentCleanupJobs(admin, jobs);
  }
  return json({ result: data, cleanup });
}
