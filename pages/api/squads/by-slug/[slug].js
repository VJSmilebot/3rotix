import { prisma } from "../../../../lib/prisma";

export default async function handler(req, res) {
  const { slug } = req.query;

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("🔍 Looking for public squad with slug:", slug);

    const squad = await prisma.squad.findUnique({
      where: { slug: String(slug) },
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

    console.log("✅ Found squad:", squad?.name || "NOT FOUND");

    if (!squad) {
      return res.status(404).json({ error: "Squad not found" });
    }

    return res.status(200).json(squad);
  } catch (error) {
    console.error("❌ Fetch squad error:", error);
    return res.status(500).json({
      error: error?.message || "Server error",
    });
  }
}
