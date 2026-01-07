// lib/auth.js
import { createSupabaseServerClient } from "../utils/supabase/server.js";
import { prisma } from "./prisma.js";

function pickName(sbUser) {
  const md = sbUser?.user_metadata || {};
  return md.full_name || md.name || null;
}

function pickImage(sbUser) {
  const md = sbUser?.user_metadata || {};
  return md.avatar_url || md.picture || null;
}

function getBearerToken(req) {
  const auth = req.headers?.authorization || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

export async function getSupabaseUser(req, res) {
  try {
    const supabase = createSupabaseServerClient(req, res);

    const token = getBearerToken(req);

    // ✅ If token exists, validate it explicitly (works for scripts + API clients)
    // ✅ If no token, fall back to cookie-based session (works for browser)
    const { data, error } = token
      ? await supabase.auth.getUser(token)
      : await supabase.auth.getUser();

    const sbUser = data?.user;

    if (error || !sbUser) return null;

    if (!sbUser.email) return null; // your schema requires email

    const createData = {
      id: sbUser.id,
      email: sbUser.email,
      name: pickName(sbUser),
      image: pickImage(sbUser),
    };

    const updateData = {
      email: sbUser.email,
      name: pickName(sbUser),
      image: pickImage(sbUser),
    };

    try {
      const dbUser = await prisma.user.upsert({
        where: { id: sbUser.id },
        create: createData,
        update: updateData,
        select: { id: true, email: true, role: true, isSuperAdmin: true },
      });

      return dbUser;
    } catch (e) {
      // If email already exists on a different userId, don’t brick login.
      const dbUser = await prisma.user.findUnique({
        where: { email: sbUser.email },
        select: { id: true, email: true, role: true, isSuperAdmin: true },
      });
      return dbUser || null;
    }
  } catch (e) {
    console.error("getSupabaseUser error:", e);
    return null;
  }
}

export async function requireAuth(req, res) {
  const user = await getSupabaseUser(req, res);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return user;
}

export async function requireAdmin(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return null;

  const isAdmin = user.isSuperAdmin || user.role === "ADMIN";
  if (!isAdmin) {
    res.status(403).json({ error: "Forbidden" });
    return null;
  }

  return user;
}

export const getUserFromAuthHeader = getSupabaseUser;
export const getSessionUser = getSupabaseUser;
