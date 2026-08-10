import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { readEveServiceConfig } from "@/lib/ai/eve-service-config";
import { EveFastApiAdapter } from "../adapters/fastapi/client";
import { EveContextBuilder } from "../context/builder";
import { readEveContextConfig } from "../context/config";
import { SupabaseEveContextRepository } from "../context/repository";
import { readEveMvpConfig } from "./config";
import { SupabaseEveMvpRepository } from "./repository";
import { EveMvpService } from "./service";

export function createEveMvpService(
  client: SupabaseClient,
  persistenceClient: SupabaseClient = client,
): EveMvpService {
  const contextBuilder = new EveContextBuilder(
    new SupabaseEveContextRepository(client),
    readEveContextConfig(),
  );
  return new EveMvpService(
    contextBuilder,
    new EveFastApiAdapter(readEveServiceConfig()),
    new SupabaseEveMvpRepository(persistenceClient),
    readEveMvpConfig(),
  );
}

export { readEveMvpStatus } from "./status";
export { SupabaseEveMvpRepository } from "./repository";
export * from "./errors";
