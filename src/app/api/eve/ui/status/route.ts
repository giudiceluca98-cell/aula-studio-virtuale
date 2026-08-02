import { NextResponse } from "next/server";
import { readEvePanelStatus } from "@/features/eve/ui/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ checkpoint: "CORE-1.5", ui: readEvePanelStatus() });
}
