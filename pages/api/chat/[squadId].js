// pages/api/chat/[squadId].js
import { prisma } from "../../../lib/prisma";
import { withAuth } from "../../../lib/auth-middleware";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

async function handler(req, res) {
  const { squadId } = req.query;

  if (!squadId || typeof squadId !== "string") {
    return res.status(400).json({ error: "Missing squadId" });
  }

  // GET: fetch messages
  if (req.method === "GET") {
    try {
      const includeDeleted = req.query.includeDeleted === "true";

      const messages = await prisma.chatMessage.findMany({
        where: {
          squadId,
          ...(includeDeleted ? {} : { isDeleted: false }),
        },
        orderBy: { createdAt: "asc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              handle: true,
              image: true,
              role: true,
            },
          },
          replyTo: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  handle: true,
                  image: true,
                  role: true,
                },
              },
            },
          },
        },
      });

      return res.status(200).json({ messages });
    } catch (err) {
      console.error("GET /api/chat/[squadId] error:", err);
      return res.status(500).json({ error: "Failed to fetch messages" });
    }
  }

  // POST: create message
  if (req.method === "POST") {
    try {
      const { content, mediaUrls, mediaType, replyToId } = req.body || {};

      const text = typeof content === "string" ? content.trim() : "";

      if (!text && (!Array.isArray(mediaUrls) || mediaUrls.length === 0)) {
        return res.status(400).json({ error: "Message content or media required" });
      }

      const newMessage = await prisma.chatMessage.create({
        data: {
          squadId,
          userId: req.user.id,
          content: text || null,
          mediaUrls: Array.isArray(mediaUrls) ? mediaUrls : null,
          mediaType: mediaType || null,
          replyToId: replyToId || null,
          isDeleted: false,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              handle: true,
              image: true,
              role: true,
            },
          },
          replyTo: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  handle: true,
                  image: true,
                  role: true,
                },
              },
            },
          },
        },
      });

      // Optional realtime broadcast (ignore failures)
      try {
        const channel = supabaseAdmin.channel(`squad:${squadId}`);
        await channel.send({
          type: "broadcast",
          event: "chat_message",
          payload: { squadId, messageId: newMessage.id },
        });
      } catch (_) {}

      return res.status(201).json({ message: newMessage });
    } catch (err) {
      console.error("POST /api/chat/[squadId] error:", err);
      return res.status(500).json({ error: "Failed to create message" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export default withAuth(handler);
