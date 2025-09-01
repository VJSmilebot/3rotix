// utils/supabase/server.js - Server-side Supabase client
import { createServerClient } from '@supabase/ssr'

export function getSupabaseServer({ req, res }) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (name) => {
          return req.cookies[name]
        },
        set: (name, value, options) => {
          res.setHeader('Set-Cookie', `${name}=${value}; Path=/; ${options.secure ? 'Secure; ' : ''}HttpOnly; SameSite=${options.sameSite || 'Lax'}`)
        },
        remove: (name, options) => {
          res.setHeader('Set-Cookie', `${name}=; Max-Age=0; Path=/; ${options.secure ? 'Secure; ' : ''}HttpOnly; SameSite=${options.sameSite || 'Lax'}`)
        },
      },
    }
  )
}