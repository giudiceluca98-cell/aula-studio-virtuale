import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSameOriginRequest } from "@/lib/server/request-security";
import { cleanupStoragePrefix, StorageCleanupError } from "@/lib/server/storage-cleanup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Origin non consentita" }, { status: 403 });
  const { roomId } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(roomId)) {
    return NextResponse.json({ error: "Stanza non valida" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secret) return NextResponse.json({ error: "Cancellazione non configurata" }, { status: 503 });
  const admin = createAdminClient(url, secret, { auth: { autoRefreshToken: false, persistSession: false } });

  const { error: prepareError } = await supabase.rpc("prepare_study_room_deletion", { p_room_id: roomId });
  if (prepareError) {
    const denied = prepareError.code === "42501";
    if (!denied) console.error("room_delete_prepare_failed", { code: prepareError.code, roomId, userId: user.id });
    return NextResponse.json(
      { error: denied ? "Solo il proprietario può eliminare la stanza" : "Preparazione della cancellazione non riuscita" },
      { status: denied ? 403 : 409 },
    );
  }

  let removedCount = 0;
  try {
    removedCount = await cleanupStoragePrefix(admin, "study-materials", roomId);
  } catch (error) {
    const code = error instanceof StorageCleanupError ? error.code : "unknown";
    console.error("room_delete_storage_cleanup_failed", { code, roomId, userId: user.id });
    return NextResponse.json({ error: "File non eliminati: la stanza è stata bloccata in sicurezza. Riprova." }, { status: 503 });
  }

  const { error: deleteError } = await supabase.rpc("delete_study_room", { p_room_id: roomId });
  if (deleteError) {
    console.error("room_delete_database_failed", { code: deleteError.code, roomId, userId: user.id });
    return NextResponse.json({ error: "File rimossi, ma cancellazione del database non riuscita. Riprova." }, { status: 409 });
  }
  return new NextResponse(null, { status: 204, headers: { "X-Removed-Files": String(removedCount) } });
}
