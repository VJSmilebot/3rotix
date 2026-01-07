import { prisma } from "../../../../lib/prisma.js";
import { withAuth } from "../../../../lib/auth-middleware.js";

export default withAuth(async function handler(req, res) {
  const { squadId } = req.query;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const userId = req.user.id;

    const squad = await prisma.squad.findUnique({
      where: { id: String(squadId) },
      select: { ownerId: true },
    });

    if (!squad) return res.status(404).json({ error: "Squad not found" });

    if (squad.ownerId === userId) {
      return res.status(400).json({
        error: "Squad owner cannot leave. Transfer ownership or disband squad.",
      });
    }

    const membership = await prisma.squadMember.findFirst({
      where: { squadId: String(squadId), userId },
      select: { id: true },
    });

    if (!membership) {
      return res.status(404).json({ error: "Not a member of this squad" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.squadMember.delete({ where: { id: membership.id } });
      await tx.squad.update({
        where: { id: String(squadId) },
        data: { memberCount: { decrement: 1 } },
      });
    });

    return res
      .status(200)
      .json({ success: true, message: "Left squad successfully" });
  } catch (error) {
    console.error("Leave squad error:", error);
    return res
      .status(500)
      .json({ error: error?.message || "Failed to leave squad" });
  }
});
