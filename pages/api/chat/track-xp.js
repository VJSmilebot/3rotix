// /pages/api/chat/track-xp.js
// Awards XP for chat messages and returns XP + rank + badge info.

import { prisma } from "../../../lib/prisma";
import { trackChatActivity } from "../../../utils/chat-tracker";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId, message, squadId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const messageText =
      typeof message === "string" && message.trim().length > 0
        ? message
        : null;

    // User before XP (to detect rank-up + thresholds)
    const beforeUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, totalXp: true, rank: true },
    });

    if (!beforeUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // 1) Core XP + achievements (this uses all your rules/filters)
    const xpResult = await trackChatActivity({
      userId,
      messageCount: 1,
      messageText, // lets uniqueness + cooldown kick in
    });

    // 2) Reload user to see new totalXp + rank
    const afterUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, totalXp: true, rank: true },
    });

    // 3) Rank-up detection
    const rankUp =
      beforeUser.rank !== afterUser.rank
        ? { rankUp: true, newRank: afterUser.rank }
        : null;

    // 4) Badge mapping → BadgeToast keys
    const newBadges = [];

    // First chat achievement → FIRST_XP badge
    const firstChatAch = (xpResult.achievements || []).find(
      (a) => a.slug === "first-chat" && a.isNew
    );
    if (firstChatAch) {
      newBadges.push("FIRST_XP");
    }

    // Total XP thresholds
    if (afterUser.totalXp >= 200 && beforeUser.totalXp < 200) {
      newBadges.push("CREW_200");
    }
    if (afterUser.totalXp >= 500 && beforeUser.totalXp < 500) {
      newBadges.push("CULT_500");
    }
    if (afterUser.totalXp >= 1000 && beforeUser.totalXp < 1000) {
      newBadges.push("ICONIC_1000");
    }

    // (Optional later: monthly grind, etc.)
    // if (earnedThisMonth >= 500 && prevMonthEarned < 500) {
    //   newBadges.push("MONTH_500");
    // }

    return res.status(200).json({
      ok: true,
      xp: xpResult.xp,                 // { chat, achievements, total }
      achievements: xpResult.achievements,
      user: afterUser,
      rankUp,
      newBadges,
      squadId: squadId || null,
    });
  } catch (err) {
    console.error("Error in /api/chat/track-xp:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
