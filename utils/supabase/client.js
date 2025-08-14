// utils/supabase/client.js
import { createClient } from '@supabase/supabase-js';

// Keep a single client instance in the browser.
let browserClient;

export function getSupabaseClient() {
  if (!browserClient) {
    browserClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: true,
          storageKey: 'sb-3rotix-auth', // custom key avoids clashes
        },
      }
    );
  }
  return browserClient;
}
