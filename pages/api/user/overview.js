// /pages/api/user/overview.js
import { prisma } from "../../../lib/prisma";

function monthStart() {
  const d = new Date();
  d.setDate(1); d.setHours(0,0,0,0);
  return d;
}

const RANK_THRESHOLDS = { ROOKIE: 0, CREW: 200, CULT: 500, ICONIC: 1000 };

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const userId = (req.query.userId || "").toString().trim();
  if (!userId) return res.status(400).json({ error: "userId required" });

  try {
    const [user, monthRows, recentLogs] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true, handle: true, image: true, rank: true, totalXp: true, createdAt: true }
      }),
      prisma.xPLog.groupBy({
        by: ["userId"],
        where: { userId, createdAt: { gte: monthStart() } },
        _sum: { xpValue: true }
      }),
      prisma.xPLog.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, actionType: true, xpValue: true, refId: true, createdAt: true }
      }),
    ]);

    if (!user) return res.status(404).json({ error: "User not found" });

    const monthXp = (monthRows[0]?._sum?.xpValue) || 0;

    // next rank math
    const ordered = ["ROOKIE", "CREW", "CULT", "ICONIC"];
    const currentIdx = ordered.indexOf(user.rank);
    const nextRank = currentIdx >= 0 && currentIdx < ordered.length - 1 ? ordered[currentIdx + 1] : null;
    const currentThreshold = RANK_THRESHOLDS[user.rank] ?? 0;
    const nextThreshold = nextRank ? (RANK_THRESHOLDS[nextRank] ?? 0) : null;
    const toNext = nextThreshold != null ? Math.max(0, nextThreshold - user.totalXp) : 0;
    const pctToNext = nextThreshold != null
      ? Math.min(100, Math.round(((user.totalXp - currentThreshold) / (nextThreshold - currentThreshold)) * 100))
      : 100;

    res.status(200).json({
      user,
      stats: {
        monthXp,
        totalXp: user.totalXp,
        rank: user.rank,
        nextRank,
        currentThreshold,
        nextThreshold,
        toNext,
        pctToNext,
      },
      recent: recentLogs
    });
  } catch (e) {
    res.status(400).json({ error: String(e.message || e) });
  }
}
