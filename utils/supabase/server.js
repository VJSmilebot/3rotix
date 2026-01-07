import { createServerClient } from "@supabase/ssr";

function parseCookieHeader(cookieHeader = "") {
  const out = {};
  if (!cookieHeader) return out;

  for (const part of cookieHeader.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const name = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (name) out[name] = value;
  }
  return out;
}

function serializeCookie(name, value, options = {}) {
  const enc = encodeURIComponent;
  let str = `${name}=${enc(value ?? "")}`;

  if (options.maxAge != null) str += `; Max-Age=${options.maxAge}`;
  if (options.expires) str += `; Expires=${options.expires.toUTCString()}`;
  str += `; Path=${options.path || "/"}`;
  if (options.domain) str += `; Domain=${options.domain}`;
  if (options.sameSite) {
    const ss =
      typeof options.sameSite === "string"
        ? options.sameSite
        : options.sameSite === true
        ? "Strict"
        : "Lax";
    str += `; SameSite=${ss}`;
  } else {
    str += `; SameSite=Lax`;
  }
  if (options.secure) str += `; Secure`;
  if (options.httpOnly) str += `; HttpOnly`;

  return str;
}

function appendSetCookie(res, cookieStr) {
  const prev = res.getHeader("Set-Cookie");
  const arr = Array.isArray(prev) ? prev : prev ? [prev] : [];
  arr.push(cookieStr);
  res.setHeader("Set-Cookie", arr);
}

// API routes + getServerSideProps
export function createSupabaseServerClient(req, res) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  const cookieObj =
    req?.cookies && Object.keys(req.cookies).length
      ? req.cookies
      : parseCookieHeader(req?.headers?.cookie || "");

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return Object.entries(cookieObj).map(([name, value]) => ({
          name,
          value,
        }));
      },
      setAll(cookiesToSet) {
        if (!res) return;
        for (const { name, value, options } of cookiesToSet) {
          appendSetCookie(res, serializeCookie(name, value, options));
        }
      },
    },

    // If you *still* have some clients sending Bearer tokens, you can add this later:
    // global: {
    //   headers: req?.headers?.authorization
    //     ? { Authorization: req.headers.authorization }
    //     : undefined,
    // },
  });
}
  