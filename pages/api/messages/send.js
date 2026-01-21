// pages/api/messages/send.js
import { prisma } from "../../../lib/prisma";
import { withAuth } from "../../../lib/auth-middleware";
import { createSupabaseServerClient } from "../../../utils/supabase/server";
import { trackDMActivity } from "../../../utils/chat-tracker";

export default withAuth(async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const userId = req.user.id;
  const { conversationId, content, mediaUrls, mediaType } = req.body || {};

  if (!conversationId) {
    return res.status(400).json({ ok: false, error: "Missing conversationId" });
  }

  const hasText = typeof content === "string" && content.trim().length > 0;
  const hasMedia = Array.isArray(mediaUrls) && mediaUrls.length > 0;

  if (!hasText && !hasMedia) {
    return res.status(400).json({ ok: false, error: "Message content or media is required" });
  }

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        participant1Id: true,
        participant2Id: true,
        isUnlocked: true,
        unlockPrice: true,
      },
    });

    if (!conversation) {
      return res.status(404).json({ ok: false, error: "Conversation not found" });
    }

    const isParticipant =
      conversation.participant1Id === userId || conversation.participant2Id === userId;

    if (!isParticipant) {
      return res.status(403).json({ ok: false, error: "Not allowed" });
    }

    // Lock handling
    if (!conversation.isUnlocked && (conversation.unlockPrice || 0) > 0) {
      return res.status(402).json({
        ok: false,
        error: "Conversation locked",
        requiresUnlock: true,
        unlockPrice: conversation.unlockPrice,
      });
    }

    // REQUIRED by schema: receiverId
    const receiverId =
      conversation.participant1Id === userId
        ? conversation.participant2Id
        : conversation.participant1Id;

    if (!receiverId) {
      return res.status(500).json({ ok: false, error: "Unable to determine receiverId" });
    }

    // If DB column is jsonb, prefer null over [] when empty
    const safeMediaUrls = hasMedia ? mediaUrls : null;

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        receiverId,
        content: hasText ? content.trim() : null,
        mediaUrls: safeMediaUrls,
        mediaType: mediaType || null,
      },
    });

    // XP + achievements (idempotent per message.id)
    let rewardsDelta = null;
    try {
      rewardsDelta = await trackDMActivity({
        userId,
        messageCount: 1,
        messageText: hasText ? content.trim() : null,
        messageId: message.id,
      });
    } catch (e) {
      console.warn("DM XP tracking failed:", e?.message || e);
      rewardsDelta = null;
    }

    // Sender profile for client UI
    const sender = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, handle: true, image: true },
    });

    const payload = {
      ...message,
      sender: sender
        ? { id: sender.id, name: sender.name, handle: sender.handle, image: sender.image }
        : null,
      rewardsDelta,
    };

    // Realtime broadcast using server client
    const supabase = createSupabaseServerClient(req, res);
    await supabase.channel(`dm-${conversationId}`).send({
      type: "broadcast",
      event: "new-message",
      payload,
    });

    return res.status(200).json({ ok: true, data: { success: true, message: payload } });
  } catch (err) {
    console.error("Error sending message:", err);
    return res.status(500).json({ ok: false, error: "Failed to send message" });
  }
});
