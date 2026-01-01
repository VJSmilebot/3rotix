// pages/api/messages/send.js
import { createClient } from "@supabase/supabase-js";
import { prisma } from "../../../lib/prisma";
import { trackDMActivity } from "../../../utils/chat-tracker";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token =
    req.headers.authorization?.replace("Bearer ", "") ||
    req.cookies["sb-access-token"];

  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

  const { conversationId, content, mediaUrls, mediaType } = req.body || {};

  if (!conversationId) {
    return res.status(400).json({ error: "Missing conversationId" });
  }

  const hasText = typeof content === "string" && content.trim().length > 0;
  const hasMedia = Array.isArray(mediaUrls) && mediaUrls.length > 0;

  if (!hasText && !hasMedia) {
    return res.status(400).json({ error: "Message content or media is required" });
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

    if (!conversation) return res.status(404).json({ error: "Conversation not found" });

    const isParticipant =
      conversation.participant1Id === user.id || conversation.participant2Id === user.id;

    if (!isParticipant) return res.status(403).json({ error: "Not allowed" });

    // Lock handling (keeps your UI flow intact)
    if (!conversation.isUnlocked && (conversation.unlockPrice || 0) > 0) {
      return res.status(402).json({
        error: "Conversation locked",
        requiresUnlock: true,
        unlockPrice: conversation.unlockPrice,
      });
    }

    // ✅ REQUIRED by your schema: receiverId
    const receiverId =
      conversation.participant1Id === user.id
        ? conversation.participant2Id
        : conversation.participant1Id;

    if (!receiverId) {
      return res.status(500).json({ error: "Unable to determine receiverId" });
    }

    // If your DB column is jsonb, prefer null over [] when empty
    const safeMediaUrls = hasMedia ? mediaUrls : null;

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: user.id,
        receiverId, // ✅ add this
        content: hasText ? content.trim() : null,
        mediaUrls: safeMediaUrls,
        mediaType: mediaType || null,
      },
    });

    // XP + achievements (idempotent per message.id)
    let rewardsDelta = null;
    try {
      rewardsDelta = await trackDMActivity({
        userId: user.id,
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
      where: { id: user.id },
      select: { id: true, name: true, handle: true, image: true },
    });

    const payload = {
      ...message,
      sender: sender
        ? { id: sender.id, name: sender.name, handle: sender.handle, image: sender.image }
        : null,
      rewardsDelta,
    };

    // Realtime broadcast
    await supabase.channel(`dm-${conversationId}`).send({
      type: "broadcast",
      event: "new-message",
      payload,
    });

    return res.status(200).json({ success: true, message: payload });
  } catch (err) {
    console.error("Error sending message:", err);
    return res.status(500).json({ error: "Failed to send message" });
  }
}
