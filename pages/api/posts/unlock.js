// pages/api/posts/unlock.js
import { prisma } from "../../../lib/prisma";
import { withAuth } from "../../../lib/auth-middleware";
import crypto from "crypto";

export default withAuth(async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const userId = req.user.id;
  const { postId, unlockLipz: bodyUnlockLipz, unlockPrice } = req.body || {};

  if (!postId) {
    return res.status(400).json({ ok: false, error: "postId required" });
  }

  try {
    const post = await prisma.subscriberPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({ ok: false, error: "Post not found" });
    }

    // ✅ DEV CHEAT: allow self-unlock for testing
    const allowSelfUnlock =
      process.env.NODE_ENV !== "production" &&
      (process.env.ALLOW_SELF_UNLOCK === "true" || true);

    if (!allowSelfUnlock && post.creatorId === userId) {
      return res.status(400).json({ ok: false, error: "You can't unlock your own post" });
    }

    // ✅ DEV CHEAT: SubscriberPost schema doesn't have unlockPrice right now,
    // so accept it from the request OR default to 150 in dev.
    const devDefaultUnlock = process.env.NODE_ENV !== "production" ? 150 : 0;

    const unlockLipz = Number(
      bodyUnlockLipz ?? unlockPrice ?? post.unlockPrice ?? devDefaultUnlock
    );

    if (!Number.isInteger(unlockLipz) || unlockLipz <= 0) {
      return res.status(400).json({
        ok: false,
        error: "This post is not unlockable yet",
        hint: "Send { postId, unlockLipz: 150 } in dev",
      });
    }

    // already unlocked? (only if table exists)
    const existing = await prisma.postUnlock
      ?.findUnique?.({
        where: { postId_userId: { postId, userId } },
      })
      .catch(() => null);

    if (existing) {
      const w = await prisma.wallet.findUnique({ where: { userId } });
      return res.status(200).json({
        ok: true,
        data: { message: "Already unlocked", newBalance: w?.lipzBalance ?? 0 },
      });
    }

    // platform fee percent (fallback 10)
    const settings = await prisma.platformSettings.findUnique({
      where: { id: "default" },
      select: { globalplatformcutpercent: true },
    });

    const feePercent = Number(settings?.globalplatformcutpercent ?? 10);
    const platformFeeCents = Math.floor((unlockLipz * feePercent) / 100);
    const creatorNetCents = unlockLipz - platformFeeCents;

    const result = await prisma.$transaction(async (tx) => {
      // ensure buyer wallet exists
      await tx.wallet.upsert({
        where: { userId },
        create: { userId, lipzBalance: 0, earningsCents: 0, currency: "USD" },
        update: {},
      });

      // race-safe debit
      const dec = await tx.wallet.updateMany({
        where: { userId, lipzBalance: { gte: unlockLipz } },
        data: { lipzBalance: { decrement: unlockLipz } },
      });
      if (dec.count !== 1) throw new Error("INSUFFICIENT_LIPZ");

      // credit creator earnings
      await tx.wallet.upsert({
        where: { userId: post.creatorId },
        create: {
          userId: post.creatorId,
          lipzBalance: 0,
          earningsCents: creatorNetCents,
          currency: "USD",
        },
        update: { earningsCents: { increment: creatorNetCents } },
      });

      // record transaction (make sure POST_UNLOCK exists in your enum, or swap to a valid type)
      const ledgerTx = await tx.transaction.create({
        data: {
          userId,
          creatorId: post.creatorId,
          type: "POST_UNLOCK",
          lipzAmount: unlockLipz,
          amountCents: unlockLipz, // 1 Lipz = 1 cent
          platformFeeCents,
          creatorNetCents,
          metadata: { postId, devSelfUnlock: post.creatorId === userId },
        },
      });

      // OPTIONAL: if you have PostUnlock table
      let unlockRow = null;
      if (tx.postUnlock?.create) {
        unlockRow = await tx.postUnlock.create({
          data: { id: crypto.randomUUID(), postId, userId, createdAt: new Date() },
        });
      }

      const updatedBuyerWallet = await tx.wallet.findUnique({ where: { userId } });
      return { ledgerTx, unlockRow, updatedBuyerWallet };
    });

    return res.status(200).json({
      ok: true,
      data: {
        success: true,
        message: "Post unlocked",
        newBalance: result.updatedBuyerWallet?.lipzBalance ?? 0,
      },
    });
  } catch (err) {
    if (err?.message === "INSUFFICIENT_LIPZ") {
      return res.status(400).json({ ok: false, error: "Insufficient Lipz balance" });
    }
    console.error("Post unlock error:", err);
    return res.status(500).json({ ok: false, error: "Failed to unlock post" });
  }
});
