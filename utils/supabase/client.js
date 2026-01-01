import { createBrowserClient } from '@supabase/ssr'

// Keep a single client instance in the browser.
let browserClient;

export function getSupabaseClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }
  return browserClient;
}