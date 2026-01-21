// pages/api/users/[userId].js
import { prisma } from "../../../lib/prisma";
import { withAuth } from "../../../lib/auth-middleware";
import { createClient } from "@supabase/supabase-js";

/** keep handles consistent */
function normalizeHandle(input) {
  if (typeof input !== "string") return null;
  const h = input
    .trim()
    .toLowerCase()
    .replace(/^@+/, "")
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (!h) return null;
  if (h.length < 3) return null;
  if (h.length > 24) return null;
  return h;
}

export default withAuth(async function handler(req, res) {
  const { userId } = req.query;

  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ ok: false, error: "userId-required" });
  }

  // Accept either Prisma id OR supabaseId in the URL
  const target = await prisma.user.findFirst({
    where: {
      OR: [{ id: userId }, { supabaseId: userId }],
    },
    select: { id: true, supabaseId: true, role: true },
  });

  if (!target) {
    return res.status(404).json({ ok: false, error: "user-not-found" });
  }

  // Only allow editing your own user (or ADMIN)
  const isSelf =
    req.user?.id === target.id ||
    (req.user?.supabaseId && target.supabaseId && req.user.supabaseId === target.supabaseId);

  const isAdmin = req.user?.role === "ADMIN" || req.user?.isSuperAdmin === true;

  if (!isSelf && !isAdmin) {
    return res.status(403).json({ ok: false, error: "forbidden" });
  }

  const prismaUserId = target.id;

  // GET - Fetch user by ID
  if (req.method === "GET") {
    try {
      const user = await prisma.user.findUnique({
        where: { id: prismaUserId },
        select: {
          id: true,
          supabaseId: true,
          email: true,
          name: true,
          handle: true,
          image: true,
          bio: true,
          website: true,
          twitter: true,
          instagram: true,
          isPublic: true,
          role: true,
          totalXp: true,
          createdAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({ ok: false, error: "user-not-found" });
      }

      return res.status(200).json({ ok: true, user });
    } catch (error) {
      console.error("[api/users/[userId] GET] error:", error);
      return res.status(500).json({ ok: false, error: "failed-to-fetch-user" });
    }
  }

  // PATCH - Update user profile
  if (req.method === "PATCH") {
    try {
      const body = req.body || {};
      const updateData = {};

      if ("name" in body) updateData.name = body.name?.trim() || null;
      if ("bio" in body) updateData.bio = body.bio?.trim() || null;

      if ("website" in body) updateData.website = body.website?.trim() || null;
      if ("twitter" in body) updateData.twitter = body.twitter?.trim() || null;
      if ("instagram" in body) updateData.instagram = body.instagram?.trim() || null;

      if ("image" in body) updateData.image = body.image || null;
      if ("isPublic" in body) updateData.isPublic = body.isPublic !== false;

      // Handle updates: enforce format + uniqueness
      if ("handle" in body) {
        const next = normalizeHandle(body.handle);
        if (!next) {
          return res.status(400).json({
            ok: false,
            error: "invalid-handle",
            message: "Handle must be 3–24 chars (letters/numbers/_).",
          });
        }

        const existing = await prisma.user.findFirst({
          where: {
            handle: next,
            NOT: { id: prismaUserId },
          },
          select: { id: true },
        });

        if (existing) {
          return res.status(409).json({
            ok: false,
            error: "handle-taken",
            message: "That handle is already taken.",
          });
        }

        updateData.handle = next;
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ ok: false, error: "no-fields" });
      }

const user = await prisma.user.update({
  where: { id: userId },
  data: updateData,
  select: {
    id: true,
    supabaseId: true,
    email: true,
    name: true, 
    handle: true,
    image: true,
    bio: true,
    website: true,
    twitter: true,
    instagram: true,
    isPublic: true,
    role: true,
    totalXp: true,
  },
});

// OPTIONAL BUT RECOMMENDED: keep Supabase metadata in sync
// (needs service role / admin client on server)
try {
  const { supabaseAdmin } = await import("../../../lib/supabaseAdmin.js");
  if (user?.supabaseId) {
    await supabaseAdmin.auth.admin.updateUserById(user.supabaseId, {
      user_metadata: {
        full_name: user.name || undefined,
        name: user.name || undefined,
        avatar_url: user.image || undefined,
        picture: user.image || undefined,
      },
    });
  }
} catch (e) {
  console.warn("Supabase metadata sync failed (non-fatal):", e?.message || e);
}

return res.status(200).json({ ok: true, user });

    } catch (error) {
      console.error("[api/users/[userId] PATCH] error:", error);
      return res.status(500).json({ ok: false, error: "failed-to-update-user" });
    }
  }

  return res.status(405).json({ ok: false, error: "method-not-allowed" });
});
