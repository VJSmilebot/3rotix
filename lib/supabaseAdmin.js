// lib/supabaseAdmin.js
// Server-side Supabase client with service role for admin operations (storage, etc.)
// IMPORTANT: Never expose this to the client. Use only on server-side.

import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export { supabaseAdmin }