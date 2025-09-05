import { createServerClient } from '@supabase/ssr'

// This function is for use in API routes and getServerSideProps
export function createSupabaseServerClient(req, res) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY, // Use service role for admin tasks
    {
      cookies: {
        get(name) {
          return req.cookies[name]
        },
        set(name, value, options) {
          // A simple cookie setting helper
          const cookieParts = [`${name}=${value}`, `Path=/`];
          if (options.maxAge) cookieParts.push(`Max-Age=${options.maxAge}`);
          if (options.sameSite) cookieParts.push(`SameSite=${options.sameSite}`);
          if (options.secure) cookieParts.push('Secure');
          if (options.httpOnly) cookieParts.push('HttpOnly');
          res.appendHeader('Set-Cookie', cookieParts.join('; '));
        },
        remove(name, options) {
          // A simple cookie removal helper
          res.appendHeader('Set-Cookie', `${name}=; Path=/; Max-Age=0; SameSite=${options.sameSite || 'Lax'};`);
        },
      },
    }
  )
}