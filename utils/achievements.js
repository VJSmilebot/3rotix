// utils/achievements.js
// Canonical achievement tracking for 3rotix v1.
// Right now this handles chat-based achievements:
// - first-chat
// - chat-master
//
// It is designed to be easy to extend with more events later.

const { prisma } = require("../lib/prisma");

// Static config for known achievements.
// These should match rows in the Achievement table by slug.
// If a row does not exist yet, it will be created with these defaults.
const ACHIEVEMENT_CONFIG = {
  "first-chat": {
    slug: "first-chat",
    name: "First Chat",
    description: "Send your first chat message",
    category: "chat",
    xpReward: 100,
    targetValue: 1,
    secret: false,
  },
  "chat-master": {
    slug: "chat-master",
    name: "Chat Master",
    description: "Send 1000 chat messages",
    category: "chat",
    xpReward: 500,
    targetValue: 1000,
    secret: false,
  },
};

// Map events to the achievement slugs they should progress.
const EVENT_ACHIEVEMENTS = {
  "chat-message": ["first-chat", "chat-master"],
  // More events can be added here later.
};

/**
 * Internal helper: ensure an Achievement row exists for a given slug.
 * If it exists, returns it. If not, creates it using ACHIEVEMENT_CONFIG.
 */
async function getOrCreateAchievement(tx, slug) {
  const seed = ACHIEVEMENT_CONFIG[slug];
  if (!seed) {
    // Unknown slug, skip entirely.
    return null;
  }

  let achievement = await tx.achievement.findUnique({
    where: { slug },
  });

  if (!achievement) {
    achievement = await tx.achievement.create({
      data: {
        slug: seed.slug,
        name: seed.name,
        description: seed.description,
        category: seed.category,
        xpReward: seed.xpReward,
        icon: null,
        targetValue: seed.targetValue,
        secret: seed.secret,
      },
    });
  }

  return achievement;
}

/**
 * Track progress towards achievements for a given user and event.
 *
 * Params:
 * - userId: string (required)
 * - event: string (required), e.g. "chat-message"
 * - amount: number (default 1), the amount of progress to add
 *
 * Returns: Array of achievement state objects:
 * [
 *   {
 *     name,
 *     slug,
 *     description,
 *     progress,
 *     target,
 *     completed,
 *     xpAwarded,
 *     isNew,
 *   },
 *   ...
 * ]
 *
 * Note: This function does not itself call awardXP. It only returns xpAwarded
 * so the caller can decide how to apply that XP (e.g. via lib/xp.awardXP).
 */
async function trackProgress({ userId, event, amount = 1 }) {
  if (!userId) {
    throw new Error("trackProgress: userId is required");
  }
  if (!event) {
    throw new Error("trackProgress: event is required");
  }

  const slugs = EVENT_ACHIEVEMENTS[event];
  if (!slugs || slugs.length === 0) {
    // No achievements tied to this event.
    return [];
  }

  return prisma.$transaction(async (tx) => {
    const results = [];

    for (const slug of slugs) {
      const achievement = await getOrCreateAchievement(tx, slug);
      if (!achievement) continue;

      const target = achievement.targetValue || 1;

      // Find existing UserAchievement progress, if any
      let progressRow = await tx.userAchievement.findUnique({
        where: {
          userId_achievementId: {
            userId,
            achievementId: achievement.id,
          },
        },
      });

      const previousProgress = progressRow ? progressRow.progress : 0;
      const wasCompleted = progressRow ? progressRow.completed : false;

      const newProgress = previousProgress + amount;
      const nowCompleted = newProgress >= target;

      if (!progressRow) {
        progressRow = await tx.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id,
            progress: newProgress,
            completed: nowCompleted,
            completedAt: nowCompleted ? new Date() : null,
          },
        });
      } else {
        progressRow = await tx.userAchievement.update({
          where: { id: progressRow.id },
          data: {
            progress: newProgress,
            completed: nowCompleted,
            completedAt:
              nowCompleted && !wasCompleted
                ? new Date()
                : progressRow.completedAt,
          },
        });
      }

      const justCompleted = nowCompleted && !wasCompleted;
      const xpAwarded = justCompleted ? achievement.xpReward : 0;

      results.push({
        name: achievement.name,
        slug: achievement.slug,
        description: achievement.description,
        progress: newProgress,
        target,
        completed: nowCompleted,
        xpAwarded,
        isNew: justCompleted,
      });
    }

    return results;
  });
}

module.exports = {
  trackProgress,
};
