import { createServerClient } from '@supabase/ssr'

// This function is for use in API routes and getServerSideProps
export function createSupabaseServerClient(req, res) {
  // Get token from Authorization header OR cookies
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          // First try to get from cookies
          const cookieValue = req.cookies[name];
          if (cookieValue) return cookieValue;
          
          // If no cookie but we have a token, use it for access token
          if (token && name === 'sb-access-token') {
            return token;
          }
          
          return undefined;
        },
        set(name, value, options) {
          if (!res) return;
          res.setHeader('Set-Cookie', `${name}=${value}; Path=/; ${options.maxAge ? `Max-Age=${options.maxAge};` : ''} ${options.httpOnly ? 'HttpOnly;' : ''} ${options.secure ? 'Secure;' : ''} SameSite=Lax`);
        },
        remove(name, options) {
          if (!res) return;
          res.setHeader('Set-Cookie', `${name}=; Path=/; Max-Age=0`);
        },
      },
    }
  );
}