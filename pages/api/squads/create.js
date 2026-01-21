import { randomUUID } from "crypto";
import { prisma } from "../../../lib/prisma.js";
import { withAuth } from "../../../lib/auth-middleware.js";
import { awardXP } from "../../../lib/xp.js";

function slugify(str) {
  return String(str || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default withAuth(async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const ownerId = req.user.id; // ✅ never trust client ownerId

    const { name, slug, description, maxMembers, isPrivate } = req.body || {};
    if (!name) return res.status(400).json({ ok: false, error: "Missing required field: name" });

    const baseSlug = slugify(slug || name);
    if (!baseSlug) return res.status(400).json({ ok: false, error: "Invalid name/slug" });

    const squadId = randomUUID();
    const finalSlug = `${baseSlug}-${squadId.slice(0, 6)}`;

    const createdSquad = await prisma.$transaction(async (tx) => {
      const squad = await tx.squad.create({
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
          ownerId,
          creatorId: ownerId,
        },
      });

      await tx.squadChat.create({
        data: {
          id: randomUUID(),
          squadId: squad.id,
          isOpen: true,
        },
      });

      await tx.squadMember.create({
        data: {
          id: randomUUID(),
          squadId: squad.id,
          userId: ownerId,
          role: "owner", // ✅ matches your string roles
          contributionXp: 0,
        },
      });

      return squad;
    });

    // Award XP through centralized function (handles XP_ENABLED flag internally)
    await awardXP({
      userId: ownerId,
      actionType: "SQUAD_CREATE",
      xpValue: 50,
      refId: createdSquad.id,
      idempotencyKey: `squad-create-${ownerId}-${createdSquad.id}`
    });

    return res.status(201).json({ ok: true, data: { squad: createdSquad } });
  } catch (error) {
    console.error("Create squad error:", error);
    return res.status(500).json({
      ok: false,
      error: error?.message || "Failed to create squad",
    });
  }
});
