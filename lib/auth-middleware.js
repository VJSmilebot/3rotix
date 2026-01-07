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
 * then map to your Prisma user record.
 */
async function getUserFromBearer(req) {
  const token = getBearerToken(req);
  if (!token) return null;

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) return null;

    const user = data.user;

    // Match by id OR email (same logic as lib/auth.js)
    const dbUser = await prisma.user.findFirst({
      where: { OR: [{ id: user.id }, { email: user.email ?? "" }] },
      select: { id: true, email: true, role: true },
    });

    return dbUser || null;
  } catch {
    return null;
  }
}

/**
 * Wrap a pages/api handler with auth.
 *
 * Usage:
 *   export default withAuth(async (req,res)=>{...})
 *
 *   export default withAuth(async (req,res)=>{...}, { roles: ["ADMIN"] })
 *
 *   export default withAuth({ roles: ["ADMIN"] })(async (req,res)=>{...})
 */
export function withAuth(handlerOrOptions, maybeOptions) {
  // Signature: withAuth(handler, options?)
  if (typeof handlerOrOptions === "function") {
    return wrapHandler(handlerOrOptions, maybeOptions);
  }

  // Signature: withAuth(options)(handler)
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
    // 1) Try cookie-based auth (your existing flow)
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
    req.userId = user.id;

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
