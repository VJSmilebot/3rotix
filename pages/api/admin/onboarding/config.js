// pages/api/admin/onboarding/config.js
import { prisma } from "../../../../lib/prisma";
import { getUserFromAuthHeader } from "../../../../lib/auth";

export default async function handler(req, res) {
  const { user: sbUser, error } = await getUserFromAuthHeader(req);
  if (error) return res.status(401).json({ error });

  const me = await prisma.user.findUnique({ where: { id: sbUser.id } });
  if (!me) return res.status(404).json({ error: "User not found" });

  const isAdmin = me.role === "ADMIN" || me.role === "SUPERADMIN";
  if (!isAdmin) return res.status(403).json({ error: "Admin only" });

  const config = await prisma.onboardingConfig.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", activeVersion: 1, locked: false, updatedByUserId: me.id },
  });

  if (req.method === "GET") return res.status(200).json({ ok: true, config });

  if (req.method === "PATCH") {
    // Only SUPERADMIN can lock/unlock (main-admin behavior)
    const { locked, bumpVersion } = req.body || {};

    if (typeof locked === "boolean" && me.role !== "SUPERADMIN") {
      return res.status(403).json({ error: "Only SUPERADMIN can lock/unlock" });
    }

    const next = await prisma.onboardingConfig.update({
      where: { id: "default" },
      data: {
        locked: typeof locked === "boolean" ? locked : config.locked,
        activeVersion: bumpVersion ? config.activeVersion + 1 : config.activeVersion,
        updatedByUserId: me.id,
      },
    });

    return res.status(200).json({ ok: true, config: next });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
