import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { readEveMvpConfig } from "@/features/eve/mvp/config";
import { EveMvpDisabledError, EveMvpPersistenceError, SupabaseEveMvpRepository } from "@/features/eve/mvp/server";
import { EveContextAuthenticationError } from "@/features/eve/context/errors";

const schema = z.object({
  roomId: z.string().trim().min(1).max(240),
  conversationId: z.string().trim().min(1).max(240),
  responseMessageId: z.string().trim().min(1).max(240),
  rating: z.enum(["helpful", "not_helpful", "incorrect", "unsafe"]),
  note: z.string().trim().min(4).max(2000).optional(),
}).strict();

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const config = readEveMvpConfig();
    if (!config.enabled || !config.feedbackEnabled) throw new EveMvpDisabledError();
    const client = await createClient();
    const auth = await client.auth.getUser();
    if (auth.error || !auth.data.user) throw new EveContextAuthenticationError();
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "feedback_invalid" }, { status: 422 });
    const receipt = await new SupabaseEveMvpRepository(client).recordFeedback(auth.data.user.id, parsed.data);
    return NextResponse.json({ checkpoint: "CORE-1.7", ...receipt }, { status: 201 });
  } catch (error) {
    if (error instanceof EveContextAuthenticationError) return NextResponse.json({ error: error.code }, { status: 401 });
    if (error instanceof EveMvpDisabledError) return NextResponse.json({ error: error.code }, { status: 503 });
    if (error instanceof EveMvpPersistenceError) return NextResponse.json({ error: error.code, detail: "Feedback non salvato" }, { status: 500 });
    return NextResponse.json({ error: "feedback_internal_error", detail: "Feedback non salvato" }, { status: 500 });
  }
}
