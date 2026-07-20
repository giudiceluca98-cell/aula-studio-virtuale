import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isSameOriginRequest } from "@/lib/server/request-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const NO_TIMER_SESSION_ID = "11111111-1111-4111-8111-111111111111";

const leaveSchema = z.object({
  event: z.literal("user_left_room"),
  roomId: z.uuid(),
  sessionId: z.uuid(),
  revision: z.number().int().min(1),
  clientSentAt: z.iso.datetime(),
  data: z.object({
    durationSeconds: z.number().int().min(0).max(31_536_000),
    lessonsCompleted: z.array(z.string().trim().min(1).max(160)).max(100),
    exercisesCompleted: z.number().int().min(0).max(100_000),
    lastMaterialId: z.uuid().nullable(),
    lastResourceOpened: z.string().trim().max(4096).nullable().optional().default(null),
    notesAdded: z.number().int().min(0).max(100_000),
    finalTimerStatus: z.enum(["running", "paused", "completed"]),
    hasOtherActiveConnection: z.boolean().optional().default(false),
  }),
});

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Origin non consentita" }, { status: 403 });
  let payload: z.infer<typeof leaveSchema>;
  try { payload = leaveSchema.parse(await request.json()); }
  catch { return NextResponse.json({ error: "Payload non valido" }, { status: 400 }); }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const noTimerSession = payload.sessionId === NO_TIMER_SESSION_ID;
  if (!noTimerSession) {
    const { error: saveError } = await supabase.rpc("autosave_study_session", {
      p_session_id: payload.sessionId,
      p_revision: payload.revision,
      p_summary: {
        duration_seconds: payload.data.durationSeconds,
        lessons_completed: payload.data.lessonsCompleted,
        exercises_completed: payload.data.exercisesCompleted,
        last_material_id: payload.data.lastMaterialId,
        last_resource_opened: payload.data.lastResourceOpened,
        notes_added: payload.data.notesAdded,
        final_timer_status: payload.data.finalTimerStatus,
        final: true,
      },
    });
    if (saveError) {
      console.error("session_leave_save_failed", { code: saveError.code, sessionId: payload.sessionId });
      return NextResponse.json({ error: "Riepilogo non salvato" }, { status: 409 });
    }
  }

  if (!payload.data.hasOtherActiveConnection) {
    const { error: presenceError } = await supabase.rpc("mark_presence_left", { p_room_id: payload.roomId });
    if (presenceError) console.error("session_leave_presence_failed", { code: presenceError.code });
  }

  const { error: activityError } = await supabase.from("activity_events").insert({
    room_id: payload.roomId,
    actor_id: user.id,
    event_type: "user_left_room",
    summary: "Partecipante uscito dalla stanza",
    payload: payload.data,
  });
  if (activityError) console.error("session_leave_activity_failed", { code: activityError.code });
  return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
