import { NextResponse, type NextRequest } from "next/server";
import { PROGRAMMING_LESSON_ID } from "@/lib/catalog/subjects/programming-zero-lesson";
import { applyLessonAction, eveLessonAdvice, lessonActionSchema, lessonSubmissionFor, normalizeLessonProgress } from "@/lib/programming-lesson-progress";
import { roomContentIdSchema } from "@/lib/room-content-removal";
import { isSameOriginRequest } from "@/lib/server/request-security";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ roomId: string; materialId: string }> }) {
  if (!isSameOriginRequest(request)) return json({ error: "origin_not_allowed" }, 403);
  const values = await params;
  if (!roomContentIdSchema.safeParse(values.roomId).success || !roomContentIdSchema.safeParse(values.materialId).success) return json({ error: "invalid_resource" }, 400);
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > 12 * 1024) return json({ error: "payload_too_large" }, 413);
  let candidate: unknown;
  try { candidate = JSON.parse(raw); } catch { return json({ error: "invalid_json" }, 400); }
  const parsed = lessonActionSchema.safeParse(candidate);
  if (!parsed.success) return json({ error: "invalid_lesson_action" }, 400);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ error: "not_authenticated" }, 401);
  const [{ data: material, error: materialError }, { data: progress }, { data: duplicateEvent }] = await Promise.all([
    supabase.from("materials").select("id,room_id,internal_viewer,metadata").eq("id", values.materialId).eq("room_id", values.roomId).is("archived_at", null).single(),
    supabase.from("material_reader_progress").select("exercise_state,active_seconds").eq("user_id", user.id).eq("material_id", values.materialId).maybeSingle(),
    supabase.from("activity_events").select("id").eq("room_id", values.roomId).eq("client_event_id", parsed.data.eventId).maybeSingle(),
  ]);
  if (materialError || !material) return json({ error: "material_not_found" }, 404);
  if (material.internal_viewer !== "lesson" || material.metadata?.lesson_id !== PROGRAMMING_LESSON_ID) return json({ error: "not_a_native_lesson" }, 409);

  const before = normalizeLessonProgress(progress?.exercise_state);
  if (duplicateEvent) return json({ result: { saved: true, duplicate: true }, state: before, feedback: null, eve: eveLessonAdvice(before) });
  const serverTimestamp = new Date().toISOString();
  let applied: ReturnType<typeof applyLessonAction>;
  try { applied = applyLessonAction(before, parsed.data, serverTimestamp); }
  catch { return json({ error: "lesson_item_not_found" }, 404); }

  const submission = lessonSubmissionFor(parsed.data);
  if (submission) {
    const { error } = await supabase.from("native_lesson_submissions").upsert({
      user_id: user.id, room_id: values.roomId, material_id: values.materialId,
      lesson_id: PROGRAMMING_LESSON_ID, activity_id: submission.activityId,
      activity_type: submission.activityType, response: submission.response, status: "submitted",
    }, { onConflict: "user_id,material_id,activity_id" });
    if (error) return json({ error: "submission_save_failed" }, 409);
  }

  const actionEvent = parsed.data.type === "self_assessment_completed" ? null : parsed.data.type;
  const eventType = !before.lessonCompleted && applied.state.lessonCompleted ? "lesson_completed" : actionEvent;
  const { data, error } = await supabase.rpc("record_native_lesson_progress", {
    p_room_id: values.roomId,
    p_material_id: values.materialId,
    p_state: {
      viewer: "lesson", state: applied.state.lessonCompleted ? "completed" : "active",
      paragraphIndex: 0, tokenIndex: 0, scrollRatio: 0,
      documentPosition: { currentSectionId: applied.state.currentSectionId },
      pageNumber: null, pageCount: null, videoTimeSeconds: 0, videoDurationSeconds: 0,
      watchedRanges: [], watchedUniqueSeconds: 0, completionPercentage: applied.state.completionPercentage,
      activeSeconds: Number(progress?.active_seconds ?? 0), exerciseState: applied.state,
    },
    p_event_type: eventType,
    p_client_event_id: parsed.data.eventId,
    p_event_payload: { lessonId: PROGRAMMING_LESSON_ID, itemId: "sectionId" in parsed.data ? parsed.data.sectionId : "exerciseId" in parsed.data ? parsed.data.exerciseId : "questionId" in parsed.data ? parsed.data.questionId : null, quizScore: applied.state.quizScore },
  });
  if (error) {
    const status = error.code === "42501" ? 403 : error.code === "P0002" ? 404 : 409;
    return json({ error: status === 403 ? "not_authorized" : status === 404 ? "material_not_found" : "save_failed" }, status);
  }
  return json({ result: data, state: applied.state, feedback: applied.feedback, eve: eveLessonAdvice(applied.state) });
}
