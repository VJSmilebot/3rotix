import { createClient } from "@supabase/supabase-js";
import { prisma } from "../../../lib/prisma";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Tip a post with Lipz
 * Body: { postId, amount, message? }
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

  const { postId, amount, message } = req.body || {};
  if (!postId) return res.status(400).json({ error: "postId required" });

  const lipzAmount = Number(amount);
  if (!Number.isInteger(lipzAmount) || lipzAmount <= 0) {
    return res.status(400).json({ error: "Valid amount required" });
  }

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, creatorId: true },
    });

    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.creatorId === user.id) {
      return res.status(400).json({ error: "You can't tip your own post" });
    }

    const settings = await prisma.platformSettings.findUnique({
      where: { id: "default" },
      select: { globalplatformcutpercent: true },
    });

    const feePercent = Number(settings?.globalplatformcutpercent ?? 10);
    const platformFeeCents = Math.floor((lipzAmount * feePercent) / 100);
    const creatorNetCents = lipzAmount - platformFeeCents;

    const result = await prisma.$transaction(async (tx) => {
      // Race-safe debit
      const dec = await tx.wallet.updateMany({
        where: { userId: user.id, lipzBalance: { gte: lipzAmount } },
        data: { lipzBalance: { decrement: lipzAmount } },
      });
      if (dec.count !== 1) throw new Error("INSUFFICIENT_LIPZ");

      // Create tip record
      const tip = await tx.tip.create({
        data: {
          fromUserId: user.id,
          toUserId: post.creatorId,
          lipzAmount,
          message: message ? String(message).slice(0, 500) : null,
        },
      });

      // Credit creator earnings
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

      // Ledger transaction
      await tx.transaction.create({
        data: {
          userId: user.id,
          creatorId: post.creatorId,
          type: "TIP",
          lipzAmount,
          amountCents: lipzAmount, // 1 Lipz = 1 cent
          platformFeeCents,
          creatorNetCents,
          metadata: {
            postId,
            tipId: tip.id,
          },
        },
      });

      const updatedBuyerWallet = await tx.wallet.findUnique({
        where: { userId: user.id },
      });

      return { tip, updatedBuyerWallet };
    });

    return res.status(200).json({
      success: true,
      tip: result.tip,
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
    console.error("Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
