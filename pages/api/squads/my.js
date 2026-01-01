import { prisma } from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const userId = typeof req.query.userId === "string" ? req.query.userId : "";
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    // ✅ Your schema: model SquadMember { squadId, userId, ... }
    const rows = await prisma.squadMember.findMany({
      where: { userId },
      select: { squadId: true },
    });

    const squadIds = rows.map((r) => r.squadId).filter(Boolean);

    if (squadIds.length === 0) return res.status(200).json([]);

    const squads = await prisma.squad.findMany({
      where: { id: { in: squadIds } },
      // optional sort
      orderBy: { updatedAt: "desc" },
    });

    return res.status(200).json(squads);
  } catch (error) {
    console.error("API /squads/my error:", error);
    return res.status(500).json({ error: error.message || "Server error" });
  }
}
