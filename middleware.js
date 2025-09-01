// middleware.js
import { NextResponse } from 'next/server';

// Export an empty middleware function that just passes through all requests
export function middleware(req) {
  return NextResponse.next();
}

// Original middleware code (commented out)
/*
async function originalMiddleware(req) {
  const res = NextResponse.next();
  const url = req.nextUrl.clone();

  // Create the Supabase client with cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return req.cookies.get(name)?.value;
        },
        set(name, value, options) {
          req.cookies.set({
            name,
            value,
            ...options,
          });
          res.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name, options) {
          req.cookies.delete({
            name,
            ...options,
          });
          res.cookies.delete({
            name,
            ...options,
          });
        },
      },
    }
  );

  // Only check protected areas
  const protectedPaths = ['/streaming', '/composer', '/overlay'];
  const isProtected = protectedPaths.some((p) => url.pathname.startsWith(p));
  if (!isProtected) return res;

  // 1) Must be logged in
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    url.pathname = '/login';
    url.searchParams.set('next', req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }

  // 2) Quick role gate (prefer user_metadata to avoid DB RTT; fall back to profiles)
  let role = session.user.user_metadata?.role;
  let allowed = role === 'creator' || role === 'admin';

  if (!allowed) {
    const { data: profile } = await supabase
      .from('profiles').select('role, plan_tier, is_creator')
      .eq('id', session.user.id).maybeSingle();
    const plan = (profile?.plan_tier || '').toLowerCase();
    allowed = !!profile?.is_creator || profile?.role === 'creator' || ['pro', 'creator', 'vip'].includes(plan);
  }

  if (!allowed) {
    url.pathname = '/creator-portal'; // or '/pricing'
    return NextResponse.redirect(url);
  }

  return res;
}
*/

// Empty matcher so middleware doesn't run on any routes
export const config = {
  matcher: [],
};
