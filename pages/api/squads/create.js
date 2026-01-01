import { prisma } from "../../../lib/prisma";

function slugify(str) {
  return String(str || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { ownerId, name, slug, description, maxMembers, isPrivate } = req.body || {};

    if (!ownerId || !name) {
      return res.status(400).json({ error: "Missing required fields: ownerId, name" });
    }

    const user = await prisma.user.findUnique({ where: { id: ownerId } });
    if (!user) return res.status(404).json({ error: "User not found" });

    // make slug optional (auto-generate if missing)
    const baseSlug = slugify(slug || name);
    if (!baseSlug) return res.status(400).json({ error: "Invalid name/slug" });

    // ensure uniqueness (simple suffix)
    const squadId = crypto.randomUUID();
    const finalSlug = `${baseSlug}-${squadId.slice(0, 6)}`;

    const squad = await prisma.$transaction(async (tx) => {
      // create squad (SCALAR fields, no relations)
      const createdSquad = await tx.squad.create({
        data: {
          id: squadId,
          name: String(name).trim(),
          slug: finalSlug,
          description: description?.trim() || null,
          maxMembers: Number(maxMembers) > 0 ? Number(maxMembers) : 50,
          type: isPrivate ? "PRIVATE" : "PUBLIC",
          level: 1,
          totalXp: 0,
          memberCount: 1,
          ownerId: ownerId,
          creatorId: ownerId,
        },
      });

      // create chat row so Homebase has chat settings
      await tx.squadChat.create({
        data: {
          id: crypto.randomUUID(),
          squadId: createdSquad.id,
          isOpen: true,
        },
      });

      // add owner as member (ID REQUIRED)
      await tx.squadMember.create({
        data: {
          id: crypto.randomUUID(),
          squadId: createdSquad.id,
          userId: ownerId,
          role: "owner", // keep consistent with your other rows
          contributionXp: 0,
        },
      });

      // XP log (optional but keep your intent)
      await tx.xPLog.create({
        data: {
          userId: ownerId,
          actionType: "SQUAD_CREATE",
          xpValue: 50,
          refId: createdSquad.id,
        },
      });

      await tx.user.update({
        where: { id: ownerId },
        data: { totalXp: { increment: 50 } },
      });

      return createdSquad;
    });

    return res.status(201).json({ squad });
  } catch (error) {
    console.error("Create squad error:", error);
    return res.status(500).json({ error: error.message || "Failed to create squad" });
  }
}
