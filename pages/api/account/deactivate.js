// pages/api/account/deactivate.js
import { prisma } from "../../../lib/prisma";
import { createSupabaseServerClient } from "../../../utils/supabase/server";
import { createClient } from "@supabase/supabase-js";

function slug(input) {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "");
}

function plusEmail(email, suffix) {
  if (!email) return null;
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  return `${local}+${suffix}@${domain}`;
}

async function ensureUniqueHandle(baseHandle, currentUserId) {
  let handle = baseHandle;

  for (let i = 0; i < 12; i++) {
    const existing = await prisma.user.findUnique({ where: { handle } });
    if (!existing || existing.id === currentUserId) return handle;
    handle = `${baseHandle}_${Math.random().toString(36).slice(2, 6)}`;
  }

  return `${baseHandle}_${Date.now().toString(36)}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const supabase = createSupabaseServerClient(req, res);
  const {
    data: { user: sbUser },
  } = await supabase.auth.getUser();

  if (!sbUser) return res.status(401).json({ error: "Unauthorized" });

  try {
    // Find Prisma user (prefer ID)
    let dbUser = await prisma.user.findUnique({ where: { id: sbUser.id } });
    if (!dbUser && sbUser.email) {
      dbUser = await prisma.user.findUnique({ where: { email: sbUser.email } });
    }
    if (!dbUser) return res.status(404).json({ error: "User not found in DB" });

    // If already deactivated, treat as ok
    if (dbUser.handle?.startsWith("deleted_")) {
      return res.status(200).json({ ok: true, already: true });
    }

    const short = slug(sbUser.id).slice(0, 10) || "unknown";
    const deletedHandleBase = `deleted_${short}`;
    const deletedHandle = await ensureUniqueHandle(deletedHandleBase, dbUser.id);

    // Free email in Prisma so the same email can be used again later
    const freedEmailSuffix = `deleted-${short}`;
    const freedEmail = plusEmail(dbUser.email, freedEmailSuffix);

    // 1) Deactivate + anonymize in Prisma (no migrations)
    await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        isPublic: false,
        name: "Deleted User",
        handle: deletedHandle,
        email: freedEmail, // <-- critical to allow re-create with original email
        image: null,
        bio: null,
        instagram: null,
        twitter: null,
        website: null,
      },
    });

    // 2) Delete Supabase Auth user so email can re-register on Supabase
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      // Prisma deactivated but Supabase auth not deleted. Still "soft delete", but email may remain blocked in Supabase.
      return res.status(200).json({
        ok: true,
        warning: "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY; Prisma deactivated, but Supabase Auth user not deleted.",
      });
    }

    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { error: delErr } = await admin.auth.admin.deleteUser(sbUser.id);

    if (delErr) {
      return res.status(200).json({
        ok: true,
        warning: `Prisma deactivated, but Supabase Auth delete failed: ${delErr.message}`,
      });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("[api/account/deactivate] error:", e);
    return res.status(500).json({ error: String(e?.message || e) });
  }
}
