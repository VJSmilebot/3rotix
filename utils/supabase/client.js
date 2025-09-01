import { createBrowserClient } from '@supabase/ssr'

export function getSupabaseClient() {
  // Add caching to prevent multiple instances
  if (!globalThis._supabaseClient) {
    globalThis._supabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  }
  return globalThis._supabaseClient
}