import { createBrowserClient } from "@supabase/ssr";

let browserClient;

export function getSupabaseClient() {
  // Prevent accidental SSR usage
  if (typeof window === "undefined") {
    throw new Error(
      "getSupabaseClient() was called on the server. Use utils/supabase/server.js instead."
    );
  }

  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  browserClient = createBrowserClient(url, anonKey);
  return browserClient;
}
