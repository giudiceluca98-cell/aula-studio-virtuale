import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createEveGroundedChatService, readEveGroundedChatStatus } from "@/features/eve/chat/server";
import {
  EveGroundedChatAuthorizationError,
  EveGroundedChatDependencyError,
  EveGroundedChatDisabledError,
  EveGroundedChatError,
  EveGroundedChatIntegrityError,
  EveGroundedChatPersistenceError,
  EveGroundedChatValidationError,
} from "@/features/eve/chat/errors";
import {
  EveContextAuthenticationError,
  EveContextAuthorizationError,
  EveContextDisabledError,
  EveContextValidationError,
} from "@/features/eve/context/errors";

const optionalId = z.string().trim().min(1).max(240).optional();
const schema = z.object({
  message: z.string().trim().min(1).max(8000),
  depth: z.enum(["brief", "normal", "deep"]).optional(),
  allowGeneralKnowledge: z.boolean().optional(),
  roomId: z.string().trim().min(1).max(240),
  scope: z.literal("private").optional(),
  conversationId: optionalId,
  courseId: optionalId,
  primaryMaterialId: optionalId,
  authorizedMaterialIds: z.array(z.string().trim().min(1).max(240)).max(100).optional(),
  subjectId: optionalId,
  moduleId: optionalId,
  lessonId: optionalId,
  sectionId: optionalId,
  selectedText: z.string().max(20_000).optional(),
  selectionLocator: z.string().trim().min(1).max(240).optional(),
  shareSelectedText: z.literal(false).optional(),
}).strict();

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(readEveGroundedChatStatus());
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const client = await createClient();
    const auth = await client.auth.getUser();
    if (auth.error || !auth.data.user) throw new EveContextAuthenticationError();
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) throw new EveGroundedChatValidationError("Richiesta chat non valida");
    let persistenceClient;
    try { persistenceClient = createAdminClient(); }
    catch { throw new EveGroundedChatDependencyError("Persistenza chat grounded non configurata"); }
    const result = await createEveGroundedChatService(client, persistenceClient)
      .run(auth.data.user.id, parsed.data);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof EveContextAuthenticationError) return NextResponse.json({ error: error.code, detail: error.message }, { status: 401 });
    if (error instanceof EveContextAuthorizationError || error instanceof EveGroundedChatAuthorizationError) return NextResponse.json({ error: error.code, detail: error.message }, { status: 403 });
    if (error instanceof EveContextValidationError || error instanceof EveGroundedChatValidationError) return NextResponse.json({ error: error.code, detail: error.message }, { status: 422 });
    if (error instanceof EveGroundedChatIntegrityError) return NextResponse.json({ error: error.code, detail: error.message }, { status: 409 });
    if (error instanceof EveContextDisabledError || error instanceof EveGroundedChatDisabledError || error instanceof EveGroundedChatDependencyError) return NextResponse.json({ error: error.code, detail: error.message }, { status: 503 });
    if (error instanceof EveGroundedChatPersistenceError || error instanceof EveGroundedChatError) return NextResponse.json({ error: error.code, detail: "Chat grounded non disponibile" }, { status: 500 });
    return NextResponse.json({ error: "grounded_chat_internal", detail: "Chat grounded non disponibile" }, { status: 500 });
  }
}
