// utils/chat-tracker.js
// Chat XP + achievement tracking with basic anti-spam / uniqueness rules.

const { prisma } = require("../lib/prisma");
const { awardXP } = require("../lib/xp");
const { trackProgress } = require("./achievements");

// Config: tune these as needed.
const CHAT_XP_PER_MESSAGE = 5;
const DM_XP_PER_MESSAGE = 5;
const MIN_MESSAGE_LENGTH = 5; // ignore messages shorter than this
const RECENT_MESSAGE_LIMIT = 20; // how many recent messages to compare against
const CHAT_COOLDOWN_SECONDS = 10; // min seconds between chat XP grants per user
const DM_COOLDOWN_SECONDS = 10; // min seconds between DM XP grants per user

// Normalize message text for uniqueness checks
function normalizeMessage(text) {
  if (!text) return "";
  return text.toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * Check whether this message should be eligible for XP.
 *
 * IMPORTANT:
 * - Prisma XPActionType enum does NOT include "DM_MESSAGE" in your schema right now.
 * - So we log DMs using actionType="CHAT_MESSAGE" but keep separate cooldown + uniqueness behavior via `context`.
 *
 * Params:
 * - userId (required)
 * - messageText (optional)
 * - actionType: must be a valid XPActionType (default "CHAT_MESSAGE")
 * - source: "GLOBAL" | "SQUAD" (for uniqueness queries)
 * - context: "CHAT" | "DM"  (controls cooldown + uniqueness model)
 */
async function isMessageEligibleForXp({
  userId,
  messageText,
  actionType = "CHAT_MESSAGE",
  source = "GLOBAL",
  context = "CHAT",
}) {
  // If we don't have text, be permissive (backwards compatible).
  if (!messageText) {
    return true;
  }

  const normalized = normalizeMessage(messageText);

  // Length rule
  if (normalized.length < MIN_MESSAGE_LENGTH) {
    return false;
  }

  const cooldownSeconds = context === "DM" ? DM_COOLDOWN_SECONDS : CHAT_COOLDOWN_SECONDS;

  // Cooldown rule: check last XP log for this actionType
  // NOTE: DMs also log as CHAT_MESSAGE until you add DM_MESSAGE to the enum.
  const lastXp = await prisma.xPLog.findFirst({
    where: {
      userId,
      actionType,
    },
    orderBy: { createdAt: "desc" },
  });

  if (lastXp) {
    const now = Date.now();
    const last = new Date(lastXp.createdAt).getTime();
    const diffSeconds = (now - last) / 1000;
    if (diffSeconds < cooldownSeconds) {
      return false;
    }
  }

  // Recent message uniqueness rule
  let recentMessages;

  if (context === "DM") {
    recentMessages = await prisma.message.findMany({
      where: { senderId: userId },
      orderBy: { createdAt: "desc" },
      take: RECENT_MESSAGE_LIMIT,
      select: { content: true },
    });
  } else if (source === "SQUAD") {
    recentMessages = await prisma.squadChatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: RECENT_MESSAGE_LIMIT,
      select: { content: true },
    });
  } else {
    recentMessages = await prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: RECENT_MESSAGE_LIMIT,
      select: { content: true },
    });
  }

  const hasDuplicate = recentMessages.some((m) => {
    const n = normalizeMessage(m.content);
    return n === normalized;
  });

  if (hasDuplicate) {
    return false;
  }

  return true;
}

/**
 * Track chat activity for a user, award XP, and update achievements.
 */
async function trackChatActivity({
  userId,
  messageCount = 1,
  messageText = null,
  messageId = null,
  source = "GLOBAL",
}) {
  if (!userId) {
    throw new Error("trackChatActivity: userId is required");
  }

  const eligible = await isMessageEligibleForXp({
    userId,
    messageText,
    actionType: "CHAT_MESSAGE",
    source,
    context: "CHAT",
  });

  let chatXp = 0;
  let achievementsXp = 0;
  const unlockedAchievements = [];

  // Only award chat XP if eligible
  if (eligible && messageCount > 0) {
    chatXp = CHAT_XP_PER_MESSAGE * messageCount;

    await awardXP({
      userId,
      actionType: "CHAT_MESSAGE",
      xpValue: chatXp,
      refId: messageId || "chat-activity",
      idempotencyKey: messageId ? `chat-${userId}-${messageId}` : `chat-${userId}-${Date.now()}`,
    });
  }

  // Always update achievements based on messageCount,
  // even if this specific message did not earn base chat XP.
  const achievementResults = await trackProgress({
    userId,
    event: "chat-message",
    amount: messageCount,
  });

  for (const a of achievementResults || []) {
    if (a.xpAwarded && a.xpAwarded > 0) {
      achievementsXp += a.xpAwarded;
    }
    unlockedAchievements.push(a);
  }

  const total = (chatXp || 0) + (achievementsXp || 0);

  return {
    xp: {
      chat: chatXp,
      achievements: achievementsXp,
      total,
    },
    achievements: unlockedAchievements,
  };
}

/**
 * Track DM activity for a user, award XP, and update achievements.
 *
 * NOTE: DMs log XP as actionType="CHAT_MESSAGE" until you add DM_MESSAGE to the enum.
 */
async function trackDMActivity({ userId, messageCount = 1, messageText = null, messageId = null }) {
  if (!userId) {
    throw new Error("trackDMActivity: userId is required");
  }

  // IMPORTANT: actionType must be a valid XPActionType.
  // We keep DM behavior via context="DM".
  const eligible = await isMessageEligibleForXp({
    userId,
    messageText,
    actionType: "CHAT_MESSAGE",
    context: "DM",
  });

  let dmXp = 0;
  let achievementsXp = 0;
  const unlockedAchievements = [];

  // Only award DM XP if eligible
  if (eligible && messageCount > 0) {
    dmXp = DM_XP_PER_MESSAGE * messageCount;

    await awardXP({
      userId,
      actionType: "CHAT_MESSAGE",
      xpValue: dmXp,
      refId: messageId || "dm-activity",
      idempotencyKey: messageId ? `dm-${userId}-${messageId}` : `dm-${userId}-${Date.now()}`,
    });
  }

  // Always update achievements based on messageCount,
  // even if this specific message did not earn base DM XP.
  const achievementResults = await trackProgress({
    userId,
    event: "dm-message",
    amount: messageCount,
  });

  for (const a of achievementResults || []) {
    if (a.xpAwarded && a.xpAwarded > 0) {
      achievementsXp += a.xpAwarded;
    }
    unlockedAchievements.push(a);
  }

  const total = (dmXp || 0) + (achievementsXp || 0);

  return {
    xp: {
      dm: dmXp,
      achievements: achievementsXp,
      total,
    },
    achievements: unlockedAchievements,
  };
}

module.exports = {
  trackChatActivity,
  trackDMActivity,
};
