import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  EveContextAuthenticationError,
  EveContextAuthorizationError,
  EveContextBuilder,
  EveContextConfigurationError,
  EveContextDisabledError,
  EveContextError,
  EveContextValidationError,
  SupabaseEveContextRepository,
  readEveContextConfig,
  readEveContextStatus,
} from "@/features/eve/context/server";

const optionalId = z.string().trim().min(1).max(240).optional();
const contextRequestSchema = z.object({
  roomId: z.string().trim().min(1).max(240),
  scope: z.enum(["private", "room_shared"]).optional(),
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
  shareSelectedText: z.boolean().optional(),
}).strict();

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ checkpoint: "CORE-1.4", ...readEveContextStatus() });
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const config = readEveContextConfig();
    if (!config.enabled) throw new EveContextDisabledError();
    const client = await createClient();
    const auth = await client.auth.getUser();
    if (auth.error || !auth.data.user) throw new EveContextAuthenticationError();
    const parsed = contextRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new EveContextValidationError("Richiesta Context Builder non valida");
    }
    const repository = new SupabaseEveContextRepository(client);
    const builder = new EveContextBuilder(repository, config);
    const result = await builder.build(auth.data.user.id, parsed.data);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof EveContextAuthenticationError) {
      return NextResponse.json({ error: error.code, detail: error.message }, { status: 401 });
    }
    if (error instanceof EveContextAuthorizationError) {
      return NextResponse.json({ error: error.code, detail: error.message }, { status: 403 });
    }
    if (error instanceof EveContextValidationError) {
      return NextResponse.json({ error: error.code, detail: error.message }, { status: 422 });
    }
    if (error instanceof EveContextDisabledError || error instanceof EveContextConfigurationError) {
      return NextResponse.json({ error: error.code, detail: error.message }, { status: 503 });
    }
    if (error instanceof EveContextError) {
      return NextResponse.json({ error: error.code, detail: "Context Builder non disponibile" }, { status: 500 });
    }
    return NextResponse.json({ error: "context_internal_error", detail: "Context Builder non disponibile" }, { status: 500 });
  }
}
