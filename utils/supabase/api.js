// utils/supabase/api.js
import { createServerClient } from "@supabase/ssr";

/**
 * Server Supabase client for API routes (cookie-aware).
 * Lets you read the session/user from cookies without requiring Authorization header.
 */
export function getSupabaseServerClient(req, res) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return createServerClient(url, anon, {
    cookies: {
      get(name) {
        return req.cookies?.[name];
      },
      set(name, value, options) {
        // Next.js API routes: set cookies on the response
        res.setHeader("Set-Cookie", serializeCookie(name, value, options));
      },
      remove(name, options) {
        res.setHeader("Set-Cookie", serializeCookie(name, "", { ...options, maxAge: 0 }));
      },
    },
  });
}

/**
 * Convenience: get user from cookies via SSR client.
 */
export async function getSupabaseUserFromCookies(req, res) {
  const supabase = getSupabaseServerClient(req, res);
  const { data, error } = await supabase.auth.getUser();
  if (error) return { user: null };
  return { user: data?.user || null };
}

/**
 * Minimal cookie serializer (no extra deps).
 * Good enough for auth cookies; if you already use a cookie lib, swap this.
 */
function serializeCookie(name, value, options = {}) {
  const opt = {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    ...options,
  };

  const parts = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`];
  if (opt.maxAge != null) parts.push(`Max-Age=${opt.maxAge}`);
  if (opt.expires) parts.push(`Expires=${opt.expires.toUTCString()}`);
  if (opt.path) parts.push(`Path=${opt.path}`);
  if (opt.domain) parts.push(`Domain=${opt.domain}`);
  if (opt.sameSite) parts.push(`SameSite=${capitalizeSameSite(opt.sameSite)}`);
  if (opt.secure) parts.push("Secure");
  if (opt.httpOnly) parts.push("HttpOnly");

  return parts.join("; ");
}

function capitalizeSameSite(v) {
  const s = String(v).toLowerCase();
  if (s === "lax") return "Lax";
  if (s === "strict") return "Strict";
  return "None";
}
