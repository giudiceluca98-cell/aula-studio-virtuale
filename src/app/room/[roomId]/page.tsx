import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { StudyRoom } from "@/components/room/study-room";
import { isDemoMode } from "@/lib/config";

export const metadata: Metadata = { title: "Stanza studio" };

export default async function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  if (roomId === "demo" && !isDemoMode) redirect("/login");
  return <StudyRoom roomId={roomId} />;
}
