import { prisma } from "../../../../lib/prisma.js";
import { withAuth } from "../../../../lib/auth-middleware.js";

const ALLOWED_UPDATES = new Set([
  "name",
  "bio",
  "image",
  "banner",
  "chatEnabled",
  "slowMode",
  "mediaEnabled",
  "website",
  "twitter",
  "instagram",
  "discord",
  "description",
  "maxMembers",
  "type",
]);

function pickAllowedUpdates(body) {
  const out = {};
  for (const [k, v] of Object.entries(body || {})) {
    if (ALLOWED_UPDATES.has(k)) out[k] = v;
  }
  return out;
}

export default withAuth(async function handler(req, res) {
  const { squadId } = req.query;

  if (req.method === "GET") {
    try {
      const settings = await prisma.squad.findUnique({
        where: { id: String(squadId) },
        select: {
          id: true,
          name: true,
          description: true,
          bio: true,
          image: true,
          banner: true,
          chatEnabled: true,
          slowMode: true,
          mediaEnabled: true,
          website: true,
          twitter: true,
          instagram: true,
          discord: true,
          maxMembers: true,
          type: true,
        },
      });

      if (!settings) return res.status(404).json({ error: "Squad not found" });

      return res.status(200).json(settings);
    } catch (error) {
      console.error("Get settings error:", error);
      return res.status(500).json({ error: error?.message || "Server error" });
    }
  }

  if (req.method === "PUT") {
    try {
      // only owner or admin
      const squad = await prisma.squad.findUnique({
        where: { id: String(squadId) },
        select: { ownerId: true },
      });

      if (!squad) return res.status(404).json({ error: "Squad not found" });

      const isAdmin = req.user.isSuperAdmin || req.user.role === "ADMIN";
      const isOwner = squad.ownerId === req.user.id;

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const updates = pickAllowedUpdates(req.body);

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }

      const updated = await prisma.squad.update({
        where: { id: String(squadId) },
        data: updates,
      });

      return res.status(200).json(updated);
    } catch (error) {
      console.error("Update settings error:", error);
      return res.status(500).json({ error: error?.message || "Server error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
});
