import { prisma } from "../../../../../lib/prisma.js";
import { withAuth } from "../../../../../lib/auth-middleware.js";

function pick(obj, keys) {
  const out = {};
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(obj || {}, k)) out[k] = obj[k];
  }
  return out;
}

export default withAuth(async function handler(req, res) {
  const { squadId } = req.query;
  const user = req.user;

  if (!squadId) return res.status(400).json({ error: "Missing squadId" });

  try {
    if (req.method === "GET") {
      const squad = await prisma.squad.findUnique({
        where: { id: String(squadId) },
        select: {
          id: true,
          ownerId: true,
          chatEnabled: true,
          slowMode: true,
          mediaEnabled: true,
        },
      });

      if (!squad) return res.status(404).json({ error: "Squad not found" });

      const chat = await prisma.squadChat.findUnique({
        where: { squadId: String(squadId) },
        select: { squadId: true, isOpen: true, mutedUntil: true, permissions: true },
      });

      return res.status(200).json({
        squadId: squad.id,
        chatEnabled: squad.chatEnabled ?? true,
        slowMode: squad.slowMode ?? null,
        mediaEnabled: squad.mediaEnabled ?? true,
        isOpen: chat?.isOpen ?? true,
        mutedUntil: chat?.mutedUntil ?? null,
        permissions: chat?.permissions ?? ["TEXT"],
      });
    }

    if (req.method === "POST" || req.method === "PUT") {
      const squad = await prisma.squad.findUnique({
        where: { id: String(squadId) },
        select: { id: true, ownerId: true },
      });

      if (!squad) return res.status(404).json({ error: "Squad not found" });

      const isAdmin = user.isSuperAdmin || user.role === "ADMIN";
      const isOwner = squad.ownerId === user.id;

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // updates on Squad table
      const squadUpdates = pick(req.body, ["chatEnabled", "slowMode", "mediaEnabled"]);

      // updates on SquadChat table
      const chatUpdates = pick(req.body, ["isOpen", "mutedUntil", "permissions"]);

      const result = await prisma.$transaction(async (tx) => {
        const updatedSquad =
          Object.keys(squadUpdates).length > 0
            ? await tx.squad.update({
                where: { id: String(squadId) },
                data: squadUpdates,
              })
            : null;

        const updatedChat =
          Object.keys(chatUpdates).length > 0
            ? await tx.squadChat.upsert({
                where: { squadId: String(squadId) }, // ✅ squadId is @unique
                create: {
                  id: crypto.randomUUID(),
                  squadId: String(squadId),
                  isOpen: chatUpdates.isOpen ?? true,
                  mutedUntil: chatUpdates.mutedUntil ?? null,
                  permissions: chatUpdates.permissions ?? ["TEXT"],
                },
                update: chatUpdates,
              })
            : null;

        return { updatedSquad, updatedChat };
      });

      return res.status(200).json({ ok: true, ...result });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Chat settings error:", error);
    return res.status(500).json({ error: error?.message || "Server error" });
  }
});
