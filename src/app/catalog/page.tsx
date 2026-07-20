import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CatalogExplorer } from "@/components/catalog/catalog-explorer";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Catalogo di studio" };
export const dynamic = "force-dynamic";

export default async function CatalogPage({ searchParams }: { searchParams: Promise<{ roomId?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/catalog");
  const { roomId } = await searchParams;
  return <CatalogExplorer preferredRoomId={roomId} />;
}
