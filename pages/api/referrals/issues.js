// pages/api/referrals/issues.js

const { prisma } = require("../../../lib/prisma.js");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body || {};
    const { userId, badgeType, metadata } = body;

    if (!userId || !badgeType) {
      return res.status(400).json({ error: "Missing userId or badgeType" });
    }

    // NOTE:
    // This assumes your Prisma schema has a Badge model like:
    // model Badge { id, userId, badgeType, metadata Json?, createdAt ... }
    //
    // If your schema differs, paste it and I'll adjust.
    const badge = await prisma.badge.create({
      data: {
        userId,
        badgeType,
        metadata: metadata ?? null,
      },
    });

    return res.status(200).json({ ok: true, badge });
  } catch (err) {
    console.error("referrals/issues error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
