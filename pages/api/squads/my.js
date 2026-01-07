import { prisma } from "../../../lib/prisma";
import { withAuth } from "../../../lib/auth-middleware.js";

export default withAuth(async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const userId = req.user.id;

    const rows = await prisma.squadMember.findMany({
      where: { userId },
      select: { squadId: true },
    });

    const squadIds = rows.map((r) => r.squadId).filter(Boolean);

    if (squadIds.length === 0) return res.status(200).json([]);

    const squads = await prisma.squad.findMany({
      where: { id: { in: squadIds } },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        bio: true,
        image: true,
        banner: true,
        level: true,
        totalXp: true,
        memberCount: true,
        type: true,
        chatEnabled: true,
        slowMode: true,
        mediaEnabled: true,
        website: true,
        twitter: true,
        instagram: true,
        discord: true,
        createdAt: true,
      },
    });

    return res.status(200).json(squads);
  } catch (error) {
    console.error("API /squads/my error:", error);
    return res.status(500).json({ error: error?.message || "Server error" });
  }
});
