import type { Metadata } from "next";
import { RoomSettings } from "@/components/room/room-settings";

export const metadata: Metadata = { title: "Impostazioni stanza" };

export default async function SettingsPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  return <RoomSettings roomId={roomId} />;
}
