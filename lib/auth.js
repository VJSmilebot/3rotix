// lib/auth.js
import { createSupabaseServerClient } from "../utils/supabase/server.js";
import { prisma } from "./prisma.js";

function pickName(sbUser) {
  const md = sbUser?.user_metadata || {};
  const name = md.full_name || md.name || null;
  return typeof name === "string" && name.trim() ? name.trim() : null;
}

function pickImage(sbUser) {
  const md = sbUser?.user_metadata || {};
  const img = md.avatar_url || md.picture || null;
  return typeof img === "string" && img.trim() ? img.trim() : null;
}

function getBearerToken(req) {
  const auth = req.headers?.authorization || req.headers?.Authorization || "";
  const m = String(auth).match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

/**
 * Canonical mapping rule:
 * - supabase auth user.id => Prisma User.supabaseId (unique)
 * - Prisma User.id can be anything (yours might match supabaseId, but doesn't have to)
 *
 * VERY IMPORTANT:
 * - Do NOT overwrite Prisma `name` or `image` from Supabase metadata unless DB is null.
 *   (Otherwise your profile save "sticks" then refresh reverts.)
 */
export async function getSupabaseUser(req, res) {
  try {
    const supabase = createSupabaseServerClient(req, res);

    const token = getBearerToken(req);
    const { data, error } = token
      ? await supabase.auth.getUser(token)
      : await supabase.auth.getUser();

    const sbUser = data?.user;
    if (error || !sbUser || !sbUser.email) return null;

    const sbName = pickName(sbUser);
    const sbImage = pickImage(sbUser);

    // 1) If we already have a user mapped by supabaseId, update ONLY stable fields.
    const bySupabaseId = await prisma.user.findUnique({
      where: { supabaseId: sbUser.id },
      select: { id: true, supabaseId: true, email: true, name: true, image: true },
    });

    if (bySupabaseId) {
      const dataToUpdate = {};

      // always keep email fresh
      if (bySupabaseId.email !== sbUser.email) dataToUpdate.email = sbUser.email;

      // only fill from metadata if DB is empty
      if (!bySupabaseId.name && sbName) dataToUpdate.name = sbName;
      if (!bySupabaseId.image && sbImage) dataToUpdate.image = sbImage;

      const dbUser =
        Object.keys(dataToUpdate).length > 0
          ? await prisma.user.update({
              where: { id: bySupabaseId.id },
              data: dataToUpdate,
              select: {
                id: true,
                supabaseId: true,
                email: true,
                role: true,
                isSuperAdmin: true,
                handle: true,
              },
            })
          : await prisma.user.findUnique({
              where: { id: bySupabaseId.id },
              select: {
                id: true,
                supabaseId: true,
                email: true,
                role: true,
                isSuperAdmin: true,
                handle: true,
              },
            });

      return dbUser || null;
    }

    // 2) If not mapped yet, try by email (handles your "weird account" duplicates)
    const byEmail = await prisma.user.findUnique({
      where: { email: sbUser.email },
      select: { id: true, supabaseId: true, email: true, name: true, image: true },
    });

    if (byEmail) {
      const dataToUpdate = {
        supabaseId: sbUser.id, // attach mapping so future auth works cleanly
      };

      // only fill from metadata if DB is empty
      if (!byEmail.name && sbName) dataToUpdate.name = sbName;
      if (!byEmail.image && sbImage) dataToUpdate.image = sbImage;

      const dbUser = await prisma.user.update({
        where: { id: byEmail.id },
        data: dataToUpdate,
        select: {
          id: true,
          supabaseId: true,
          email: true,
          role: true,
          isSuperAdmin: true,
          handle: true,
        },
      });

      return dbUser;
    }

    // 3) No user exists yet => create new user
    const createData = {
      id: sbUser.id,          // your schema requires id (no @default)
      supabaseId: sbUser.id,  // keep mapping consistent
      email: sbUser.email,
      ...(sbName ? { name: sbName } : {}),
      ...(sbImage ? { image: sbImage } : {}),
    };

    const dbUser = await prisma.user.create({
      data: createData,
      select: {
        id: true,
        supabaseId: true,
        email: true,
        role: true,
        isSuperAdmin: true,
        handle: true,
      },
    });

    return dbUser;
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
