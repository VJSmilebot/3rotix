import { createClient } from "@supabase/supabase-js";
import { prisma } from "../../../lib/prisma";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Unlock a paid post
 * Body: { postId }
 * Rule: 1 Lipz = 1 cent
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token =
    req.headers.authorization?.replace("Bearer ", "") ||
    req.cookies["sb-access-token"];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { postId } = req.body || {};
  if (!postId) {
    return res.status(400).json({ error: "postId required" });
  }

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (!post.isPaid || !post.unlockPrice) {
      return res.status(400).json({ error: "Post does not require unlock" });
    }

    if (post.creatorId === user.id) {
      return res.status(400).json({ error: "You can't unlock your own post" });
    }

    const existing = await prisma.postUnlock.findUnique({
      where: { postId_userId: { postId, userId: user.id } },
    });

    if (existing) {
      return res.status(400).json({ error: "Already unlocked" });
    }

    const settings = await prisma.platformSettings.findUnique({
      where: { id: "default" },
      select: { globalplatformcutpercent: true },
    });

    const lipzAmount = Number(post.unlockPrice);
    const feePercent = Number(settings?.globalplatformcutpercent ?? 10);
    const platformFeeCents = Math.floor((lipzAmount * feePercent) / 100);
    const creatorNetCents = lipzAmount - platformFeeCents;

    const result = await prisma.$transaction(async (tx) => {
      const unlock = await tx.postUnlock.create({
        data: {
          postId,
          userId: user.id,
          lipzPaid: lipzAmount,
        },
      });

      const dec = await tx.wallet.updateMany({
        where: { userId: user.id, lipzBalance: { gte: lipzAmount } },
        data: { lipzBalance: { decrement: lipzAmount } },
      });

      if (dec.count !== 1) throw new Error("INSUFFICIENT_LIPZ");

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

      await tx.transaction.create({
        data: {
          userId: user.id,
          creatorId: post.creatorId,
          type: "POST_UNLOCK",
          lipzAmount,
          amountCents: lipzAmount,
          platformFeeCents,
          creatorNetCents,
          metadata: {
            postId,
          },
        },
      });

      const updatedBuyerWallet = await tx.wallet.findUnique({
        where: { userId: user.id },
      });

      return { unlock, updatedBuyerWallet };
    });

    return res.status(200).json({
      success: true,
      unlock: result.unlock,
      newBalance: result.updatedBuyerWallet?.lipzBalance ?? 0,
    });
  } catch (err) {
    if (err?.message === "INSUFFICIENT_LIPZ") {
      const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
      return res.status(400).json({
        error: "Insufficient Lipz balance",
        current: wallet?.lipzBalance ?? 0,
      });
    }

    if (err?.code === "P2002") {
      return res.status(400).json({ error: "Already unlocked" });
    }

    console.error("Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
