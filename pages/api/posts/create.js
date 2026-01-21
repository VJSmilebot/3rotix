// pages/api/posts/create.js
import { prisma } from "../../../lib/prisma";
import { withAuth } from "../../../lib/auth-middleware";
import crypto from "crypto";

export default withAuth(async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const userId = req.user.id;
  const { content, mediaUrls, tierId } = req.body || {};

  if (!content || typeof content !== "string" || !content.trim()) {
    return res.status(400).json({ ok: false, error: "content required" });
  }

  try {
    // NOTE: Your Prisma schema has SubscriberPost (not Post),
    // so Prisma Client is prisma.subscriberPost
    const post = await prisma.subscriberPost.create({
      data: {
        id: crypto.randomUUID(),
        creatorId: userId,
        tierId: tierId || null,
        content: content.trim(),
        mediaUrls: Array.isArray(mediaUrls) ? mediaUrls : [],
        likesCount: 0,
        commentsCount: 0,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        creatorId: true,
        tierId: true,
        content: true,
        mediaUrls: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      ok: true,
      data: {
        message: "Post created",
        post,
        postId: post.id,
      },
    });
  } catch (err) {
    console.error("Create post error:", err);
    return res.status(500).json({ ok: false, error: "Failed to create post" });
  }
});
