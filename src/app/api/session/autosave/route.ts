import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isSameOriginRequest } from "@/lib/server/request-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const draftSchema = z.object({
  sessionId: z.uuid(),
  roomId: z.uuid(),
  startedAt: z.iso.datetime(),
  lessonsCompleted: z.array(z.string().trim().min(1).max(160)).max(100),
  exercisesCompleted: z.number().int().min(0).max(100_000),
  lastMaterialId: z.uuid().nullable(),
  lastResourceOpened: z.string().trim().max(4096).nullable().optional().default(null),
  notesAdded: z.number().int().min(0).max(100_000),
  timerStatus: z.enum(["running", "paused", "completed"]),
  clientElapsedSeconds: z.number().int().min(0).max(31_536_000),
});

const envelopeSchema = z.object({
  draft: draftSchema,
  revision: z.number().int().min(1),
  reason: z.enum(["periodic", "hidden", "online", "pagehide", "manual"]),
  clientSentAt: z.iso.datetime(),
});

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Origin non consentita" }, { status: 403 });
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 64 * 1024) return NextResponse.json({ error: "Payload troppo grande" }, { status: 413 });

  let parsed: z.infer<typeof envelopeSchema>;
  try { parsed = envelopeSchema.parse(await request.json()); }
  catch { return NextResponse.json({ error: "Payload non valido" }, { status: 400 }); }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const { error } = await supabase.rpc("autosave_study_session", {
    p_session_id: parsed.draft.sessionId,
    p_revision: parsed.revision,
    p_summary: {
      lessons_completed: parsed.draft.lessonsCompleted,
      exercises_completed: parsed.draft.exercisesCompleted,
      last_material_id: parsed.draft.lastMaterialId,
      last_resource_opened: parsed.draft.lastResourceOpened,
      notes_added: parsed.draft.notesAdded,
      timer_status: parsed.draft.timerStatus,
      client_elapsed_seconds: parsed.draft.clientElapsedSeconds,
      reason: parsed.reason,
    },
  });
  if (error) {
    console.error("session_autosave_failed", { code: error.code, sessionId: parsed.draft.sessionId });
    return NextResponse.json({ error: "Salvataggio non riuscito" }, { status: 409 });
  }
  return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
