// pages/api/tips/send.js
import { prisma } from "../../../lib/prisma";
import { withAuth } from "../../../lib/auth-middleware";

export default withAuth(async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const userId = req.user.id;
  const { creatorId, amount, message } = req.body || {};

  const lipzAmount = Number(amount);

  if (!creatorId || !Number.isInteger(lipzAmount) || lipzAmount <= 0) {
    return res.status(400).json({ ok: false, error: "Invalid tip payload" });
  }

  if (creatorId === userId) {
    return res.status(400).json({ ok: false, error: "You cannot tip yourself" });
  }

  try {
    const settings = await prisma.platformSettings.findUnique({
      where: { id: "default" },
      select: { globalplatformcutpercent: true },
    });

    const platformCutPercent = Number(settings?.globalplatformcutpercent ?? 10);

    const platformFeeCents = Math.floor((lipzAmount * platformCutPercent) / 100);
    const creatorNetCents = lipzAmount - platformFeeCents;

    const result = await prisma.$transaction(async (tx) => {
      // Race-safe debit
      const dec = await tx.wallet.updateMany({
        where: { userId, lipzBalance: { gte: lipzAmount } },
        data: { lipzBalance: { decrement: lipzAmount } },
      });

      if (dec.count !== 1) throw new Error("INSUFFICIENT_LIPZ");

      const createdTip = await tx.tip.create({
        data: {
          fromUserId: userId,
          toUserId: creatorId,
          lipzAmount: lipzAmount,
          message: message ? String(message).slice(0, 500) : null,
        },
      });

      await tx.wallet.upsert({
        where: { userId: creatorId },
        update: {
          earningsCents: { increment: creatorNetCents },
        },
        create: {
          userId: creatorId,
          lipzBalance: 0,
          earningsCents: creatorNetCents,
          currency: "USD",
        },
      });

      const createdTx = await tx.transaction.create({
        data: {
          userId,
          creatorId,
          type: "TIP",
          lipzAmount: lipzAmount,
          amountCents: lipzAmount, // 1 Lipz = 1 cent
          platformFeeCents,
          creatorNetCents,
          metadata: {
            tipId: createdTip.id,
          },
        },
      });

      const updatedSenderWallet = await tx.wallet.findUnique({
        where: { userId },
      });

      return { updatedSenderWallet, createdTip, createdTx };
    });

    return res.status(200).json({
      ok: true,
      data: {
        lipzBalance: result.updatedSenderWallet?.lipzBalance ?? 0,
        tip: result.createdTip,
        transaction: result.createdTx,
      },
    });
  } catch (err) {
    if (err?.message === "INSUFFICIENT_LIPZ") {
      const wallet = await prisma.wallet.findUnique({ where: { userId } });
      return res.status(400).json({
        ok: false,
        error: "Not enough Lipz",
        current: wallet?.lipzBalance ?? 0,
      });
    }

    console.error("Tip error:", err);
    return res.status(500).json({ ok: false, error: "Failed to send tip" });
  }
});
