import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  EveMvpAuthorizationError,
  EveMvpDisabledError,
  EveMvpError,
  EveMvpIntegrityError,
  EveMvpValidationError,
  createEveMvpService,
} from "@/features/eve/mvp/server";
import {
  EveContextAuthenticationError,
  EveContextAuthorizationError,
  EveContextDisabledError,
} from "@/features/eve/context/errors";

const schema = z.object({
  roomId: z.string().trim().min(1).max(240),
  materialId: z.string().trim().min(1).max(240),
  locator: z.string().trim().min(3).max(500),
  expectedTextSha256: z.string().regex(/^[0-9a-f]{64}$/).optional(),
}).strict();

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const client = await createClient();
    const auth = await client.auth.getUser();
    if (auth.error || !auth.data.user) throw new EveContextAuthenticationError();
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) throw new EveMvpValidationError("Richiesta apertura fonte non valida");
    const result = await createEveMvpService(client).openSource(auth.data.user.id, parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof EveContextAuthenticationError) return NextResponse.json({ error: error.code }, { status: 401 });
    if (error instanceof EveContextAuthorizationError || error instanceof EveMvpAuthorizationError) {
      return NextResponse.json({ error: error.code, detail: error.message }, { status: 403 });
    }
    if (error instanceof EveMvpValidationError) return NextResponse.json({ error: error.code, detail: error.message }, { status: 422 });
    if (error instanceof EveMvpIntegrityError) return NextResponse.json({ error: error.code, detail: error.message }, { status: 409 });
    if (error instanceof EveContextDisabledError || error instanceof EveMvpDisabledError) return NextResponse.json({ error: error.code }, { status: 503 });
    if (error instanceof EveMvpError) return NextResponse.json({ error: error.code, detail: "Fonte non disponibile" }, { status: 500 });
    return NextResponse.json({ error: "source_internal_error", detail: "Fonte non disponibile" }, { status: 500 });
  }
}
