import { NextResponse, type NextRequest } from "next/server";
import { catalogActionSchema } from "@/lib/catalog/schema";
import { getCatalogConfig } from "@/lib/catalog/config";
import { isSameOriginRequest } from "@/lib/server/request-security";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function json(body: unknown, status = 200) { return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } }); }

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return json({ error: "origin_not_allowed" }, 403);
  if (Number(request.headers.get("content-length") ?? 0) > 8 * 1024) return json({ error: "payload_too_large" }, 413);
  if (!getCatalogConfig().enabled) return json({ error: "catalog_disabled" }, 404);
  let decoded: unknown;
  try { decoded = await request.json(); } catch { return json({ error: "invalid_json" }, 400); }
  const parsed = catalogActionSchema.safeParse(decoded);
  if (!parsed.success) return json({ error: "invalid_payload" }, 400);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ error: "not_authenticated" }, 401);
  const action = parsed.data;
  if (action.action === "save_material") {
    const { error } = await supabase.from("saved_catalog_materials").upsert({ user_id: user.id, material_id: action.materialId });
    return error ? json({ error: "save_failed" }, 503) : json({ saved: true });
  }
  if (action.action === "unsave_material") {
    const { error } = await supabase.from("saved_catalog_materials").delete().eq("user_id", user.id).eq("material_id", action.materialId);
    return error ? json({ error: "save_failed" }, 503) : json({ saved: false });
  }
  if (action.action === "import_material") {
    const { data, error } = await supabase.rpc("add_catalog_material_to_room", { p_material_id: action.materialId, p_room_id: action.roomId, p_course_id: action.courseId });
    return error ? json({ error: "material_import_failed" }, 503) : json({ imported: true, result: Array.isArray(data) ? data[0] : data });
  }
  if (action.action === "update_personalization") {
    const { error } = await supabase.from("user_learning_preferences").upsert({
      user_id: user.id,
      allow_progress_personalization: action.allowProgressPersonalization,
      updated_at: new Date().toISOString(),
    });
    return error ? json({ error: "preferences_update_failed" }, 503) : json({ updated: true });
  }
  if (action.action === "save_web_material") {
    const materialType = action.resourceType === "pdf" ? "pdf"
      : action.resourceType === "notebook" ? "exercise"
      : ["video", "course", "book", "podcast"].includes(action.resourceType) ? "article"
      : action.resourceType === "page" ? "article" : "documentation";
    const { data, error } = await supabase.rpc("save_web_result_to_catalog", {
      p_title: action.title,
      p_description: action.description,
      p_provider: action.provider,
      p_source_url: action.url,
      p_language: action.language,
      p_material_type: materialType,
    });
    const result = Array.isArray(data) ? data[0] : data;
    return error || !result?.material_id
      ? json({ error: "web_material_save_failed" }, 503)
      : json({ saved: true, materialId: result.material_id, created: result.created });
  }
  const { data, error } = await supabase.rpc("add_learning_path_to_room", { p_path_id: action.pathId, p_room_id: action.roomId });
  return error ? json({ error: "path_import_failed" }, 503) : json({ imported: true, result: Array.isArray(data) ? data[0] : data });
}
