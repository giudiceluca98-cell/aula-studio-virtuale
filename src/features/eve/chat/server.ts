import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { readEveServiceConfig } from "@/lib/ai/eve-service-config";
import { EveFastApiAdapter } from "../adapters/fastapi/client";
import { EveContextBuilder } from "../context/builder";
import { readEveContextConfig } from "../context/config";
import { SupabaseEveContextRepository } from "../context/repository";
import { readEveGroundedChatConfig } from "./config";
import { SupabaseEveGroundedChatRepository } from "./repository";
import { EveGroundedChatService } from "./service";

export function createEveGroundedChatService(
  client: SupabaseClient,
  persistenceClient: SupabaseClient = client,
): EveGroundedChatService {
  const builder = new EveContextBuilder(new SupabaseEveContextRepository(client), readEveContextConfig());
  const adapter = new EveFastApiAdapter(readEveServiceConfig());
  return new EveGroundedChatService(
    builder,
    adapter,
    new SupabaseEveGroundedChatRepository(client, persistenceClient),
    readEveGroundedChatConfig(),
  );
}
export { readEveGroundedChatStatus } from "./status";
export * from "./errors";
