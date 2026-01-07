import { prisma } from "../../../../lib/prisma.js";
import { withAuth } from "../../../../lib/auth-middleware.js";
import { randomUUID } from "crypto";

export default withAuth(async function handler(req, res) {
  const { squadId } = req.query;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const userId = req.user.id;
  const XP_ENABLED = process.env.XP_ENABLED === "true";

  try {
    const squad = await prisma.squad.findUnique({
      where: { id: String(squadId) },
      select: { id: true, memberCount: true, maxMembers: true },
    });

    if (!squad) return res.status(404).json({ error: "Squad not found" });

    if (
      typeof squad.maxMembers === "number" &&
      typeof squad.memberCount === "number" &&
      squad.memberCount >= squad.maxMembers
    ) {
      return res.status(400).json({ error: "Squad is full" });
    }

    const existing = await prisma.squadMember.findFirst({
      where: { squadId: String(squadId), userId },
    });

    if (existing) {
      return res
        .status(200)
        .json({ ok: true, alreadyMember: true, membership: existing });
    }

    const membership = await prisma.$transaction(async (tx) => {
      const created = await tx.squadMember.create({
        data: {
          id: randomUUID(), // ✅ REQUIRED because SquadMember.id has no default
          squadId: String(squadId),
          userId,
          role: "member",
          contributionXp: 0,
        },
      });

      await tx.squad.update({
        where: { id: String(squadId) },
        data: { memberCount: { increment: 1 } },
      });

      return created;
    });

    if (XP_ENABLED) {
      try {
        const { awardXP } = await import("../../../../lib/xp.js");
        await awardXP({
          userId,
          actionType: "SQUAD_JOIN",
          xpValue: 50,
          refId: membership.id,
          idempotencyKey: `squad-join-${userId}-${squadId}`,
        });
      } catch (xpError) {
        console.warn("XP award failed for squad join:", xpError?.message || xpError);
      }
    }

    return res.status(200).json({ ok: true, membership });
  } catch (err) {
    console.error("Failed to join squad:", err);
    return res
      .status(500)
      .json({ error: err?.message || "Failed to join squad" });
  }
});
