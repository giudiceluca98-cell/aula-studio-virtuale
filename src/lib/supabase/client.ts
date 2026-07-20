"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | undefined;

function publicSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return { url, publishableKey };
}

/** A singleton avoids opening duplicate Realtime sockets during client renders. */
export function createClient(): SupabaseClient {
  if (!browserClient) {
    const { url, publishableKey } = publicSupabaseConfig();
    browserClient = createBrowserClient(url, publishableKey, {
      realtime: {
        params: { eventsPerSecond: 20 },
      },
    });
  }

  return browserClient;
}

/** Test-only escape hatch; application code should use createClient(). */
export function resetBrowserClientForTests(): void {
  browserClient = undefined;
}
