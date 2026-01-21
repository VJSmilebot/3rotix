import { prisma } from "../../../lib/prisma";
import { withAuth } from "../../../lib/auth-middleware";
import crypto from "crypto";

async function attemptAutoTopUp(userId, requiredLipz) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/wallet/auto-topup/process`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.INTERNAL_API_KEY,
        },
        body: JSON.stringify({ userId, requiredLipz }),
      }
    );

    if (response.ok) return { success: true, data: await response.json() };
    return { success: false };
  } catch (err) {
    console.error("Auto-top-up attempt failed:", err);
    return { success: false };
  }
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function addBillingPeriod(date) {
  return addDays(date, 30);
}

export default withAuth(async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const userId = req.user.id;
  const { tierId } = req.body || {};

  if (!tierId) {
    return res.status(400).json({ ok: false, error: "tierId required" });
  }

  try {
    const tier = await prisma.subscriptionTier.findUnique({
      where: { id: tierId },
    });

    if (!tier || !tier.isActive) {
      return res.status(404).json({ ok: false, error: "Tier not found or inactive" });
    }

    if (tier.creatorId === userId) {
      return res.status(400).json({ ok: false, error: "You can't subscribe to yourself" });
    }

    const now = new Date();

    const lipzAmount = Number(tier.pricePerMonth);
    if (!Number.isInteger(lipzAmount) || lipzAmount <= 0) {
      return res.status(400).json({ ok: false, error: "Invalid tier price" });
    }

    const settings = await prisma.platformSettings.findUnique({
      where: { id: "default" },
      select: { globalplatformcutpercent: true },
    });

    const feePercent = Number(settings?.globalplatformcutpercent ?? 10);
    const platformFeeCents = Math.floor((lipzAmount * feePercent) / 100);
    const creatorNetCents = lipzAmount - platformFeeCents;

    const existing = await prisma.userSubscription.findUnique({
      where: { userId_creatorId: { userId, creatorId: tier.creatorId } },
    });

    // Optional: allow “uncancel”
    // if (existing?.status === "ACTIVE" && existing.cancelAtPeriodEnd) { ... allow resubscribe logic ... }

    if (existing && existing.status === "ACTIVE") {
      return res.status(400).json({ ok: false, error: "Already subscribed to this creator" });
    }

    const trialDays = Number(tier.trialDays || 0);
    const trialEndsAt = trialDays > 0 ? addDays(now, trialDays) : null;

    const periodStart = now;
    const periodEnd = trialEndsAt ? trialEndsAt : addBillingPeriod(now);

    if (trialEndsAt) {
      const subscriptionId = existing?.id ?? crypto.randomUUID();

      const subscription = existing
        ? await prisma.userSubscription.update({
            where: { id: existing.id },
            data: {
              tierId: tier.id,
              status: "ACTIVE",
              currentPeriodStart: periodStart,
              currentPeriodEnd: periodEnd,
              trialEndsAt,
              cancelAtPeriodEnd: false,
              cancelledAt: null,
              updatedAt: now,
            },
          })
        : await prisma.userSubscription.create({
            data: {
              id: subscriptionId,
              userId,
              tierId: tier.id,
              creatorId: tier.creatorId,
              status: "ACTIVE",
              startedAt: now,
              currentPeriodStart: periodStart,
              currentPeriodEnd: periodEnd,
              trialEndsAt,
              cancelAtPeriodEnd: false,
              totalPaid: 0,
              updatedAt: now,
            },
          });

      return res.status(200).json({
        ok: true,
        data: { success: true, subscription, message: `Free trial started! ${trialDays} days free.` },
      });
    }

    let wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId, lipzBalance: 0, earningsCents: 0, currency: "USD" },
      });
    }

    if (wallet.lipzBalance < lipzAmount) {
      const autoTopUp = await attemptAutoTopUp(userId, lipzAmount);
      if (autoTopUp.success) {
        wallet = await prisma.wallet.findUnique({ where: { userId } });
      }
    }

    if (!wallet || wallet.lipzBalance < lipzAmount) {
      return res.status(400).json({
        ok: false,
        error: "Insufficient Lipz balance",
        required: lipzAmount,
        current: wallet?.lipzBalance ?? 0,
      });
    }

    const subscriptionPaymentId = crypto.randomUUID();

    const result = await prisma.$transaction(async (tx) => {
      const subscription = existing
        ? await tx.userSubscription.update({
            where: { id: existing.id },
            data: {
              tierId: tier.id,
              status: "ACTIVE",
              currentPeriodStart: periodStart,
              currentPeriodEnd: periodEnd,
              trialEndsAt: null,
              cancelAtPeriodEnd: false,
              cancelledAt: null,
              totalPaid: { increment: lipzAmount },
              updatedAt: now,
            },
          })
        : await tx.userSubscription.create({
            data: {
              id: crypto.randomUUID(),
              userId,
              tierId: tier.id,
              creatorId: tier.creatorId,
              status: "ACTIVE",
              startedAt: now,
              currentPeriodStart: periodStart,
              currentPeriodEnd: periodEnd,
              cancelAtPeriodEnd: false,
              totalPaid: lipzAmount,
              updatedAt: now,
            },
          });

      const dec = await tx.wallet.updateMany({
        where: { userId, lipzBalance: { gte: lipzAmount } },
        data: { lipzBalance: { decrement: lipzAmount } },
      });
      if (dec.count !== 1) throw new Error("INSUFFICIENT_LIPZ");

      await tx.wallet.upsert({
        where: { userId: tier.creatorId },
        create: {
          userId: tier.creatorId,
          lipzBalance: 0,
          earningsCents: creatorNetCents,
          currency: "USD",
        },
        update: { earningsCents: { increment: creatorNetCents } },
      });

      const payment = await tx.subscriptionPayment.create({
        data: {
          id: subscriptionPaymentId,
          subscriptionId: subscription.id,
          userId,
          creatorId: tier.creatorId,
          tierId: tier.id,
          lipzAmount,
          amountCents: lipzAmount,
          platformFeeCents,
          creatorNetCents,
          periodStart,
          periodEnd,
          status: "SUCCESS",
        },
      });

      await tx.transaction.create({
        data: {
          userId,
          creatorId: tier.creatorId,
          type: "SUBSCRIPTION_PAYMENT",
          lipzAmount,
          amountCents: lipzAmount,
          platformFeeCents,
          creatorNetCents,
          metadata: {
            subscriptionId: subscription.id,
            subscriptionPaymentId: payment.id,
            tierId: tier.id,
            periodStart,
            periodEnd,
          },
        },
      });

      const updatedBuyerWallet = await tx.wallet.findUnique({ where: { userId } });
      return { subscription, payment, updatedBuyerWallet };
    });

    return res.status(200).json({
      ok: true,
      data: {
        success: true,
        subscription: result.subscription,
        payment: result.payment,
        message: "Subscribed successfully! Payment recorded.",
        newBalance: result.updatedBuyerWallet?.lipzBalance ?? 0,
      },
    });
  } catch (err) {
    if (err?.message === "INSUFFICIENT_LIPZ") {
      return res.status(400).json({ ok: false, error: "Insufficient Lipz balance" });
    }
    console.error("Error subscribing:", err);
    return res.status(500).json({ ok: false, error: "Failed to subscribe" });
  }
});
