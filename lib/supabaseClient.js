// lib/supabaseClient.js
import { getSupabaseClient } from "../utils/supabase/client";

/**
 * Safe browser-only getter.
 * Returns null on the server to avoid SSR crashes.
 */
export function getBrowserSupabase() {
  if (typeof window === "undefined") return null;
  return getSupabaseClient();
}
