import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createEveGroundedChatService } from "@/features/eve/chat/server";
import {
  EveGroundedChatAuthorizationError,
  EveGroundedChatDependencyError,
  EveGroundedChatDisabledError,
  EveGroundedChatIntegrityError,
  EveGroundedChatValidationError,
} from "@/features/eve/chat/errors";
import { EveContextAuthenticationError, EveContextAuthorizationError } from "@/features/eve/context/errors";

const schema = z.object({
  roomId: z.string().trim().min(1).max(240),
  materialId: z.string().trim().min(1).max(240),
  locator: z.string().trim().min(1).max(500),
  expectedTextSha256: z.string().regex(/^[0-9a-f]{64}$/).optional(),
}).strict();

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const client = await createClient();
    const auth = await client.auth.getUser();
    if (auth.error || !auth.data.user) throw new EveContextAuthenticationError();
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) throw new EveGroundedChatValidationError("Richiesta fonte non valida");
    return NextResponse.json(await createEveGroundedChatService(client).openSource(auth.data.user.id, parsed.data));
  } catch (error) {
    if (error instanceof EveContextAuthenticationError) return NextResponse.json({ error: error.code }, { status: 401 });
    if (error instanceof EveContextAuthorizationError || error instanceof EveGroundedChatAuthorizationError) return NextResponse.json({ error: error.code }, { status: 403 });
    if (error instanceof EveGroundedChatValidationError) return NextResponse.json({ error: error.code }, { status: 422 });
    if (error instanceof EveGroundedChatIntegrityError) return NextResponse.json({ error: error.code }, { status: 409 });
    if (error instanceof EveGroundedChatDisabledError || error instanceof EveGroundedChatDependencyError) return NextResponse.json({ error: error.code }, { status: 503 });
    return NextResponse.json({ error: "grounded_source_internal" }, { status: 500 });
  }
}
