const { prisma } = require("../../../lib/prisma.js");

async function handler(_req, res) {
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
  const [month, all] = await Promise.all([
    prisma.impactLog.aggregate({ _sum: { xpAdded: true }, where: { createdAt: { gte: monthStart } } }),
    prisma.impactLog.aggregate({ _sum: { xpAdded: true } }),
  ]);
  res.status(200).json({ month: month._sum.xpAdded || 0, allTime: all._sum.xpAdded || 0 });
}

module.exports = handler;