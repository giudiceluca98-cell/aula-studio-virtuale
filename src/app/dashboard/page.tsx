import type { Metadata } from "next";
import { RoomLauncher } from "@/components/dashboard/room-launcher";

export const metadata: Metadata = { title: "Le tue stanze" };
export default function DashboardPage() { return <RoomLauncher />; }
