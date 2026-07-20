import { NextResponse, type NextRequest } from "next/server";
import { materialProgressRequestSchema } from "@/lib/material-learning-schema";
import { roomContentIdSchema } from "@/lib/room-content-removal";
import { isSameOriginRequest } from "@/lib/server/request-security";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ roomId: string; materialId: string }> }) {
  if (!isSameOriginRequest(request)) return json({ error: "origin_not_allowed" }, 403);
  const values = await params;
  if (!roomContentIdSchema.safeParse(values.roomId).success || !roomContentIdSchema.safeParse(values.materialId).success) return json({ error: "invalid_resource" }, 400);
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > 64 * 1024) return json({ error: "payload_too_large" }, 413);
  let candidate: unknown;
  try { candidate = JSON.parse(raw); } catch { return json({ error: "invalid_json" }, 400); }
  const parsed = materialProgressRequestSchema.safeParse(candidate);
  if (!parsed.success) return json({ error: "invalid_progress" }, 400);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ error: "not_authenticated" }, 401);
  const { data, error } = await supabase.rpc("record_material_learning_progress", {
    p_room_id: values.roomId,
    p_material_id: values.materialId,
    p_state: parsed.data.state,
    p_event_type: parsed.data.eventType ?? null,
  });
  if (error) {
    const status = error.code === "42501" ? 403 : error.code === "P0002" ? 404 : 409;
    return json({ error: status === 403 ? "not_authorized" : status === 404 ? "material_not_found" : "save_failed" }, status);
  }
  return json({ result: data });
}
