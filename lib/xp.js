// lib/xp.js
import { prisma } from "./prisma.js";

/**
 * Rank thresholds – adjust as you like.
 * These are based on totalXp on the User model.
 */
export const RANK_THRESHOLDS = {
  ROOKIE: 0,
  CREW: 200,
  CULT: 500,
  ICONIC: 1000,
};

/** Compute rank string from a totalXp integer */
export function computeRank(totalXp) {
  const xp = Number(totalXp) || 0;
  if (xp >= RANK_THRESHOLDS.ICONIC) return "ICONIC";
  if (xp >= RANK_THRESHOLDS.CULT) return "CULT";
  if (xp >= RANK_THRESHOLDS.CREW) return "CREW";
  return "ROOKIE";
}

// Must match your Prisma enum XPActionType exactly
export const ALLOWED_ACTIONS = new Set([
  "DAILY_CHECK_IN",
  "CHAT_MESSAGE",
  "STREAM_WATCH",
  "ACHIEVEMENT_UNLOCK",
  "SQUAD_CONTRIBUTION",
  "SQUAD_CHALLENGE",
  "SQUAD_LEVEL_UP",
  "ADMIN_GRANT",
  "SQUAD_CREATE",
  "SQUAD_JOIN",
]);

/**
 * Canonical XP awarding function.
 *
 * Rules:
 * - MUST provide a non-empty idempotencyKey (your DB uniqueness depends on it)
 * - Validates actionType against XPActionType enum values
 * - Creates XPLog first (so duplicates short-circuit safely)
 * - Only increments User.totalXp if the XPLog insert succeeds
 */
export async function awardXP({
  userId,
  actionType,
  xpValue,
  refId = null,
  ipHash = null,
  userAgent = null,
  idempotencyKey, // REQUIRED
}) {
  if (!userId) throw new Error("awardXP: userId is required");
  if (!actionType) throw new Error("awardXP: actionType is required");

  if (!ALLOWED_ACTIONS.has(actionType)) {
    throw new Error(`awardXP: invalid actionType "${actionType}"`);
  }

  const amount = Number(xpValue);
  if (!Number.isFinite(amount) || amount === 0) {
    throw new Error("awardXP: xpValue must be a non-zero number");
  }

  if (
    !idempotencyKey ||
    typeof idempotencyKey !== "string" ||
    !idempotencyKey.trim()
  ) {
    throw new Error("awardXP: idempotencyKey is required (non-empty string)");
  }

  const key = idempotencyKey.trim();

  return prisma.$transaction(async (tx) => {
    // 1) Create log FIRST so duplicates are caught before we increment totalXp
    let xpLog;
    try {
      xpLog = await tx.xPLog.create({
        data: {
          userId,
          actionType,
          xpValue: amount,
          refId,
          ipHash,
          userAgent,
          idempotencyKey: key,
        },
      });
    } catch (e) {
      // Prisma unique constraint violation => already awarded
      // @@unique([userId, idempotencyKey])
      if (e?.code === "P2002") {
        const existing = await tx.xPLog.findFirst({
          where: { userId, idempotencyKey: key },
        });

        const u = await tx.user.findUnique({
          where: { id: userId },
          select: { totalXp: true, rank: true },
        });

        return {
          ok: true,
          duplicate: true,
          xpLog: existing || null,
          totalXp: u?.totalXp ?? 0,
          rank: u?.rank ?? "ROOKIE",
        };
      }
      throw e;
    }

    // 2) Increment totalXp
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: { totalXp: { increment: amount } },
      select: { totalXp: true, rank: true },
    });

    // 3) Update rank if needed (simple threshold system)
    const newRank = computeRank(updatedUser.totalXp);
    let rankUp = false;

    if (newRank !== updatedUser.rank) {
      rankUp = true;
      await tx.user.update({
        where: { id: userId },
        data: { rank: newRank },
      });
    }

    return {
      ok: true,
      duplicate: false,
      xpLog,
      totalXp: updatedUser.totalXp,
      rankUp,
      newRank,
    };
  });
}
