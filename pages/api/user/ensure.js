// /pages/api/user/ensure.js
import { prisma } from "../../../lib/prisma";
import { createSupabaseServerClient } from "../../../utils/supabase/server";

function slugHandle(input) {
  return String(input || "user")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9_]/g, "");
}

function plusEmail(email, suffix) {
  if (!email) return null;
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  return `${local}+${suffix}@${domain}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabase = createSupabaseServerClient(req, res);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // 1) Canonical: try by Supabase Auth ID first
    const byId = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (byId) {
      const patch = {
        supabaseId: user.id,
        ...(user.user_metadata?.name ? { name: user.user_metadata.name } : {}),
        ...(user.user_metadata?.avatar_url ? { image: user.user_metadata.avatar_url } : {}),
      };

      const updated = await prisma.user.update({
        where: { id: user.id },
        data: patch,
      });

      return res.status(200).json({ user: updated, idMismatch: false });
    }

    // 2) Fallback: check by email (legacy rows)
    const byEmail = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (byEmail) {
      const newEmail = plusEmail(user.email, `supabase-${user.id.slice(0, 8)}`);

      const created = await prisma.user.create({
        data: {
          id: user.id,
          supabaseId: user.id,
          email: newEmail,
          name: user.user_metadata?.name || byEmail.name || "User",
          handle: slugHandle(user.user_metadata?.name || "user"),
          image: user.user_metadata?.avatar_url || byEmail.image || null,
          role: byEmail.role || "CREATOR",
          totalXp: byEmail.totalXp ?? 0,
        },
      });

      return res.status(200).json({
        user: created,
        idMismatch: true,
        note:
          "A legacy user row existed under the same email but different id. Created a new canonical user row with plus-addressed email to avoid conflicts.",
        legacy: { id: byEmail.id, email: byEmail.email },
      });
    }

    // 3) Brand new user: create canonical row
    const created = await prisma.user.create({
      data: {
        id: user.id,
        supabaseId: user.id,
        email: user.email,
        name: user.user_metadata?.name || "User",
        handle: slugHandle(user.user_metadata?.name || "user"),
        image: user.user_metadata?.avatar_url || null,
        role: "CREATOR",
        totalXp: 0,
      },
    });

    return res.status(200).json({ user: created, idMismatch: false });
  } catch (error) {
    console.error("User ensure error:", error);
    return res.status(500).json({ error: error.message });
  }
}
