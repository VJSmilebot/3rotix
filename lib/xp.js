// lib/xp.js
const { prisma } = require("./prisma");

/**
 * Rank thresholds – adjust as you like.
 * These are based on totalXp on the User model.
 */
const RANK_THRESHOLDS = {
  ROOKIE: 0,
  CREW: 200,
  CULT: 500,
  ICONIC: 1000,
};

/** Compute rank string from a totalXp integer */
function computeRank(totalXp) {
  if (totalXp >= RANK_THRESHOLDS.ICONIC) return "ICONIC";
  if (totalXp >= RANK_THRESHOLDS.CULT) return "CULT";
  if (totalXp >= RANK_THRESHOLDS.CREW) return "CREW";
  return "ROOKIE";
}

/**
 * Canonical XP awarding function.
 *
 * All XP writes in the system should eventually flow through here,
 * either directly or via an API route that calls this.
 */
async function awardXP({
  userId,
  actionType,
  xpValue,
  refId = null,
  ipHash = null,
  userAgent = null,
  idempotencyKey = null,
}) {
  if (!userId) {
    throw new Error("awardXP: userId is required");
  }
  if (!actionType) {
    throw new Error("awardXP: actionType is required");
  }
  if (typeof xpValue !== "number" || Number.isNaN(xpValue)) {
    throw new Error("awardXP: xpValue must be a number");
  }
  if (xpValue === 0) {
    // No-op – nothing to log or change.
    return { ok: true, rankUp: false, newRank: null, totalXp: null, xpLog: null };
  }

  return prisma.$transaction(async (tx) => {
    // 1) Update user XP total
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        totalXp: {
          increment: xpValue,
        },
      },
    });

    // 2) Create XP log entry
    const xpLog = await tx.xPLog.create({
      data: {
        userId,
        xpValue,
        refId,
        ipHash,
        userAgent,
        idempotencyKey,
        actionType,
      },
    });

    // 3) Compute rank & update if changed
    const newRank = computeRank(updatedUser.totalXp);
    const rankUp = newRank !== updatedUser.rank;

    if (rankUp) {
      await tx.user.update({
        where: { id: userId },
        data: { rank: newRank },
      });
    }

    return {
      ok: true,
      rankUp,
      newRank,
      totalXp: updatedUser.totalXp,
      xpLog,
    };
  });
}

module.exports = {
  RANK_THRESHOLDS,
  computeRank,
  awardXP,
};
