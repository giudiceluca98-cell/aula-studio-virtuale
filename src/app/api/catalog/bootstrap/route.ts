import { NextResponse } from "next/server";
import { getCatalogConfig } from "@/lib/catalog/config";
import { loadCatalog } from "@/lib/catalog/repository";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = getCatalogConfig();
  if (!config.enabled) return NextResponse.json({ error: "catalog_disabled" }, { status: 404 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  try {
    const [{ topics, materials }, { data: saved }, { data: memberships }, { data: preferences }] = await Promise.all([
      loadCatalog(supabase),
      supabase.from("saved_catalog_materials").select("material_id").eq("user_id", user.id),
      supabase.from("room_members").select("room_id,study_rooms(id,name)").eq("user_id", user.id).is("left_at", null),
      supabase.from("user_learning_preferences").select("preferred_languages,preferred_formats,weekly_hours,budget,certificate_preference,theory_practice_balance,current_level,allow_progress_personalization").eq("user_id", user.id).maybeSingle(),
    ]);
    const rooms = (memberships ?? []).flatMap((membership) => {
      const room = membership.study_rooms as unknown as { id: string; name: string } | Array<{ id: string; name: string }> | null;
      return Array.isArray(room) ? room : room ? [room] : [];
    });
    return NextResponse.json({
      assistantName: "Eve",
      topics,
      materials,
      savedMaterialIds: (saved ?? []).map((row) => row.material_id),
      rooms,
      preferences: preferences ?? { preferred_languages: ["it","en"], preferred_formats: [], weekly_hours: 5, budget: "free_only", certificate_preference: "indifferent", theory_practice_balance: 50, current_level: "no_experience", allow_progress_personalization: false },
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "catalog_unavailable" }, { status: 503 });
  }
}

