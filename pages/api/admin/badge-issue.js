import { getSupabaseUser } from "../../../lib/auth.js";
import { assertAdmin, audit } from "../../../lib/admin.js";
import { prisma } from "../../../lib/prisma.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const admin = await getSupabaseUser(req);
  try {
    assertAdmin(req, admin);
    const { emailOrHandle, type, metadata } = req.body || {};
    if (!emailOrHandle || !type) return res.status(400).json({ error: "Missing fields" });

    const user = await prisma.user.findFirst({ where: { OR: [{ email: emailOrHandle }, { handle: emailOrHandle }] }, select: { id: true } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const badge = await prisma.badge.create({ data: { userId: user.id, type, ...(metadata ? { metadata } : {}) } });
    await audit(admin?.id || null, "ADMIN_BADGE_ISSUE", user.id, { type });
    res.json({ ok: true, badge });
  } catch (e) {
    res.status(403).json({ error: String(e.message || e) });
  }
}
