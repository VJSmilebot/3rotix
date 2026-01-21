// lib/auth-middleware.js
import { prisma } from "./prisma.js";
import { getSupabaseUser } from "./auth.js";
import { supabaseAdmin } from "./supabaseAdmin.js";

/** Pull Bearer token from Authorization header */
function getBearerToken(req) {
  const header = req.headers?.authorization || req.headers?.Authorization || "";
  if (typeof header !== "string") return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

/**
 * Fallback auth: validate Bearer token with Supabase Admin,
 * then map to Prisma user via supabaseId (canonical).
 */
async function getUserFromBearer(req) {
  const token = getBearerToken(req);
  if (!token) return null;

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) return null;

    const sbUser = data.user;
    const supabaseId = sbUser.id;
    const email = sbUser.email || null;

    if (!supabaseId) return null;

    // First: canonical lookup
    const bySupabaseId = await prisma.user.findUnique({
      where: { supabaseId },
      select: { id: true, supabaseId: true, email: true, role: true, handle: true, isSuperAdmin: true },
    });
    if (bySupabaseId) return bySupabaseId;

    // Fallback: email link (same safety as auth.js)
    if (email) {
      const byEmail = await prisma.user.findUnique({
        where: { email },
        select: { id: true, supabaseId: true, email: true, role: true, handle: true, isSuperAdmin: true },
      });

      if (byEmail) {
        if (byEmail.supabaseId && byEmail.supabaseId !== supabaseId) return null;

        const linked = await prisma.user.update({
          where: { id: byEmail.id },
          data: { supabaseId },
          select: { id: true, supabaseId: true, email: true, role: true, handle: true, isSuperAdmin: true },
        });
        return linked;
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Wrap a pages/api handler with auth.
 */
export function withAuth(handlerOrOptions, maybeOptions) {
  if (typeof handlerOrOptions === "function") {
    return wrapHandler(handlerOrOptions, maybeOptions);
  }

  const options = handlerOrOptions || {};
  return (handler) => wrapHandler(handler, options);
}

function wrapHandler(handler, options = {}) {
  const allowedRoles =
    options.roles ||
    options.allowedRoles ||
    options.requireRole ||
    null;

  return async function authedHandler(req, res) {
    // 1) Try cookie-based auth
    let user = await getSupabaseUser(req, res);

    // 2) Fallback to Bearer token auth
    if (!user) user = await getUserFromBearer(req);

    if (!user) {
      return res.status(401).json({
        ok: false,
        error: "UNAUTHORIZED",
        message: "Missing or invalid session/token.",
      });
    }

    // ✅ Block deactivated accounts (Option A: handle starts with "deleted_")
    let handle = user.handle;
    if (!handle) {
      const db = await prisma.user.findUnique({
        where: { id: user.id },
        select: { handle: true },
      });
      handle = db?.handle || null;
    }

    if (handle && handle.startsWith("deleted_")) {
      return res.status(403).json({
        ok: false,
        error: "ACCOUNT_DEACTIVATED",
        message: "This account has been deactivated.",
      });
    }

    // role enforcement (optional)
    if (allowedRoles) {
      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
      if (!roles.includes(user.role)) {
        return res.status(403).json({
          ok: false,
          error: "FORBIDDEN",
          message: "Insufficient permissions.",
        });
      }
    }

    // Attach user for downstream handlers
    req.user = user;
    req.userId = user.id; // Prisma user id (canonical for DB writes)

    try {
      return await handler(req, res);
    } catch (err) {
      console.error("API handler error:", err);
      return res.status(500).json({
        ok: false,
        error: "SERVER_ERROR",
        message: "Unhandled server error.",
      });
    }
  };
}
