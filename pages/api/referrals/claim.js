const { prisma } = require("../../../lib/prisma.js");
const { awardXP } = require("../../../lib/xp");

async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { code, referredUserId } = req.body || {};
  if (!code || !referredUserId) return res.status(400).json({ error: "Missing fields" });
  const referral = await prisma.referral.findUnique({ where: { code } });
  if (!referral || referral.status !== "PENDING") return res.status(400).json({ error: "Invalid code" });
  await prisma.referral.update({ where: { id: referral.id }, data: { status: "CLAIMED", referredUserId } });
  await awardXP({ userId: referral.ownerUserId, actionType: "referral_claimed", xpValue: 50, refId: referral.id });
  await awardXP({ userId: referredUserId, actionType: "referred_join", xpValue: 25, refId: referral.id });
  res.status(200).json({ ok: true });
}

module.exports = handler;