import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  EveMvpAuthorizationError,
  EveMvpDependencyError,
  EveMvpDisabledError,
  EveMvpError,
  EveMvpIntegrityError,
  EveMvpPersistenceError,
  EveMvpValidationError,
  createEveMvpService,
  readEveMvpStatus,
} from "@/features/eve/mvp/server";
import {
  EveContextAuthenticationError,
  EveContextAuthorizationError,
  EveContextDisabledError,
  EveContextValidationError,
} from "@/features/eve/context/errors";

const optionalId = z.string().trim().min(1).max(240).optional();
const requestSchema = z.object({
  question: z.string().trim().min(1).max(20_000),
  mode: z.string().trim().min(1).max(64).optional(),
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
  return NextResponse.json(readEveMvpStatus());
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const client = await createClient();
    const auth = await client.auth.getUser();
    if (auth.error || !auth.data.user) throw new EveContextAuthenticationError();
    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) throw new EveMvpValidationError("Richiesta MVP non valida");
    let persistenceClient;
    try { persistenceClient = createAdminClient(); }
    catch { throw new EveMvpDependencyError("Persistenza MVP non configurata"); }
    const result = await createEveMvpService(client, persistenceClient)
      .run(auth.data.user.id, parsed.data);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof EveContextAuthenticationError) {
      return NextResponse.json({ error: error.code, detail: error.message }, { status: 401 });
    }
    if (error instanceof EveContextAuthorizationError || error instanceof EveMvpAuthorizationError) {
      return NextResponse.json({ error: error.code, detail: error.message }, { status: 403 });
    }
    if (error instanceof EveContextValidationError || error instanceof EveMvpValidationError) {
      return NextResponse.json({ error: error.code, detail: error.message }, { status: 422 });
    }
    if (error instanceof EveMvpIntegrityError) {
      return NextResponse.json({ error: error.code, detail: error.message }, { status: 409 });
    }
    if (error instanceof EveContextDisabledError || error instanceof EveMvpDisabledError || error instanceof EveMvpDependencyError) {
      return NextResponse.json({ error: error.code, detail: error.message }, { status: 503 });
    }
    if (error instanceof EveMvpPersistenceError || error instanceof EveMvpError) {
      return NextResponse.json({ error: error.code, detail: "Gate MVP non disponibile" }, { status: 500 });
    }
    return NextResponse.json({ error: "mvp_internal_error", detail: "Gate MVP non disponibile" }, { status: 500 });
  }
}
