import { getSupabaseUser } from "../../../lib/auth.js";
import { assertAdmin, audit } from "../../../lib/admin.js";
import { prisma } from "../../../lib/prisma.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const admin = await getSupabaseUser(req);
  try {
    assertAdmin(req, admin);
    const { emailOrHandle, bio, linksJson, isPerformer, markAccepted } = req.body || {};

    const user = await prisma.user.findFirst({ where: { OR: [{ email: emailOrHandle }, { handle: emailOrHandle }] }, select: { id: true } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const data = {};
    if (typeof bio === "string") data.bio = bio;
    if (typeof linksJson === "string") data.linksJson = linksJson;
    if (typeof isPerformer === "boolean") data.isPerformer = isPerformer;
    if (markAccepted) data.legalAcceptedAt = new Date();

    const profile = await prisma.creatorProfile.upsert({ where: { userId: user.id }, update: data, create: { userId: user.id, ...data } });
    await audit(admin?.id || null, "ADMIN_PROFILE_UPSERT", user.id, data);
    res.json({ ok: true, profile });
  } catch (e) {
    res.status(403).json({ error: String(e.message || e) });
  }
}
