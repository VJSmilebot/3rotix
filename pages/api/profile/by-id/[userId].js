// pages/api/profile/by-id/[userId].js
import { prisma } from "../../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const userId = Array.isArray(req.query.userId) ? req.query.userId[0] : req.query.userId;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  try {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        handle: true,
        name: true,
        bio: true,
        image: true,
        createdAt: true,
      },
    });

    if (!u) return res.status(404).json({ error: "User not found" });

    // Return the shape your UI likely expects (username/displayName/avatarUrl),
    // mapped from your actual schema (handle/name/image).
    return res.status(200).json({
      id: u.id,
      username: u.handle || null,
      displayName: u.name || null,
      bio: u.bio || null,
      avatarUrl: u.image || null,
      createdAt: u.createdAt,
    });
  } catch (err) {
    console.error("Error fetching profile:", err);
    return res.status(500).json({ error: "Failed to fetch profile" });
  }
}
