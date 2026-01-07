import { prisma } from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("🔍 Fetching public squads...");

    const squads = await prisma.squad.findMany({
      orderBy: { createdAt: "desc" },

      // PUBLIC DISCOVERY FIELDS ONLY
      // (no ownerId/creatorId, no internal flags, no XP while XP is on pause)
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
}

    });

    console.log("✅ Found public squads:", squads.length);
    console.log("📦 Sample squad:", squads[0]);

    return res.status(200).json(squads);
  } catch (error) {
    console.error("❌ Fetch squads error:", error);
    return res.status(500).json({
      error: error?.message || "Server error",
    });
  }
}
