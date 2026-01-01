// /pages/api/leaderboard.js
import { prisma } from "../../lib/prisma";

function getMonthStart() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * GET /api/leaderboard?period=month|all&limit=50&offset=0
 * Simple offset pagination for now (beginner-friendly).
 * Response includes both totalXp and monthXp so UI can show either.
 */
export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const period = (req.query.period || "all").toString();
  const limit = Math.min(parseInt(req.query.limit || "25", 10), 100);
  const offset = Math.max(parseInt(req.query.offset || "0", 10), 0);
  const monthStart = getMonthStart();

  try {
    if (period === "all") {
      // Get top users by totalXp
      const users = await prisma.user.findMany({
        orderBy: [{ totalXp: "desc" }, { id: "asc" }],
        take: limit,
        skip: offset,
        select: {
          id: true,
          handle: true,
          name: true,
          image: true,
          rank: true,
          totalXp: true,
        },
      });

      // Compute monthXp for returned users
      const userIds = users.map((u) => u.id);
      const monthXpRows = await prisma.xPLog.groupBy({
        by: ["userId"],
        where: { userId: { in: userIds }, createdAt: { gte: monthStart } },
        _sum: { xpValue: true },
      });
      const monthMap = new Map(
        monthXpRows.map((r) => [r.userId, r._sum.xpValue || 0])
      );

      const items = users.map((u, i) => ({
        position: offset + i + 1,
        userId: u.id,
        handle: u.handle || null,
        name: u.name || null,
        image: u.image || null,
        rank: u.rank,
        totalXp: u.totalXp,
        monthXp: monthMap.get(u.id) || 0,
      }));

      return res.status(200).json({
        period: "all",
        limit,
        offset,
        items,
        nextOffset: items.length === limit ? offset + limit : null,
      });
    }

    // period === "month": compute month sums, then join user profile fields
    const monthRows = await prisma.xPLog.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: monthStart } },
      _sum: { xpValue: true },
      orderBy: { _sum: { xpValue: "desc" } },
      take: limit,
      skip: offset,
    });

    const userIds = monthRows.map((r) => r.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        handle: true,
        name: true,
        image: true,
        rank: true,
        totalXp: true,
      },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const items = monthRows.map((row, i) => {
      const u = userMap.get(row.userId) || {};
      return {
        position: offset + i + 1,
        userId: row.userId,
        handle: u.handle || null,
        name: u.name || null,
        image: u.image || null,
        rank: u.rank || "ROOKIE",
        totalXp: u.totalXp || 0,
        monthXp: row._sum?.xpValue || 0,
      };
    });

    return res.status(200).json({
      period: "month",
      limit,
      offset,
      items,
      nextOffset: items.length === limit ? offset + limit : null,
    });
  } catch (e) {
    return res.status(400).json({ error: String(e.message || e) });
  }
}
