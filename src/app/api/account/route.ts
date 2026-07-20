import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSameOriginRequest } from "@/lib/server/request-security";
import { cleanupStoragePrefix, StorageCleanupError } from "@/lib/server/storage-cleanup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Origin non consentita" }, { status: 403 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secret) return NextResponse.json({ error: "Cancellazione non configurata" }, { status: 503 });

  const admin = createAdminClient(url, secret, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error: prepareError } = await supabase.rpc("prepare_account_deletion");
  if (prepareError) {
    console.error("account_delete_prepare_failed", { code: prepareError.code, userId: user.id });
    return NextResponse.json({ error: "Preparazione della cancellazione non riuscita" }, { status: 409 });
  }

  const [{ data: memberships, error: membershipError }, { data: materials, error: materialError }] = await Promise.all([
    admin.from("room_members").select("room_id").eq("user_id", user.id),
    admin.from("materials").select("room_id").eq("created_by", user.id),
  ]);
  if (membershipError || materialError) {
    console.error("account_delete_storage_lookup_failed", { code: membershipError?.code ?? materialError?.code, userId: user.id });
    return NextResponse.json({ error: "Inventario dei file non riuscito" }, { status: 503 });
  }

  const roomIds = new Set<string>([
    ...(memberships ?? []).map((membership) => membership.room_id),
    ...(materials ?? []).map((material) => material.room_id),
  ]);
  try {
    for (const roomId of roomIds) {
      await cleanupStoragePrefix(admin, "study-materials", `${roomId}/${user.id}`);
    }
  } catch (cause) {
    const code = cause instanceof StorageCleanupError ? cause.code : "unknown";
    console.error("account_delete_storage_cleanup_failed", { code, userId: user.id });
    return NextResponse.json({ error: "Cancellazione dei file non riuscita; l'account è ancora attivo. Riprova." }, { status: 503 });
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("account_delete_failed", { code: error.code, userId: user.id });
    return NextResponse.json({ error: "Cancellazione non riuscita" }, { status: 500 });
  }
  return new NextResponse(null, { status: 204, headers: { "Clear-Site-Data": '"cookies", "storage"' } });
}
