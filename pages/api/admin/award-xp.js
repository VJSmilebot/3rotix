import { awardXP } from "../../../lib/xp.js";              // you already have this util
import { getSupabaseUser } from "../../../lib/auth.js";
import { assertAdmin, audit } from "../../../lib/admin.js";
import { prisma } from "../../../lib/prisma.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const admin = await getSupabaseUser(req);
  try {
    assertAdmin(req, admin);
    const { emailOrHandle, actionType, xpValue, refId } = req.body || {};
    if (!emailOrHandle || !actionType || typeof xpValue !== "number") return res.status(400).json({ error: "Missing fields" });

    const user = await prisma.user.findFirst({ where: { OR: [{ email: emailOrHandle }, { handle: emailOrHandle }] }, select: { id: true } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const out = await awardXP({ userId: user.id, actionType, xpValue, refId, idempotencyKey: `admin:${actionType}:${user.id}:${Date.now()}` });
    await audit(admin?.id || null, "ADMIN_AWARD_XP", user.id, { actionType, xpValue, refId });
    res.json({ ok: true, ...out });
  } catch (e) {
    res.status(403).json({ error: String(e.message || e) });
  }
}
