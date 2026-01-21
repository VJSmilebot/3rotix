import { prisma } from "../../../lib/prisma";
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

    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    }
    return { success: false };
  } catch (err) {
    console.error("Auto-top-up attempt failed:", err);
    return { success: false };
  }
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export default async function handler(req, res) {
  const cronSecret = req.headers["x-cron-secret"];
  if (cronSecret !== process.env.CRON_SECRET) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const now = new Date();

    // platform fee % (fallback 10)
    const settings = await prisma.platformSettings.findUnique({
      where: { id: "default" },
      select: { globalplatformcutpercent: true },
    });
    const feePercent = Number(settings?.globalplatformcutpercent ?? 10);

    const subscriptionsDue = await prisma.userSubscription.findMany({
      where: {
        status: "ACTIVE",
        currentPeriodEnd: { lte: now },
        cancelAtPeriodEnd: false,
      },
      include: {
        tier: true,
      },
    });

    const results = {
      total: subscriptionsDue.length,
      successful: 0,
      failed: 0,
      autoTopUps: 0,
      cancelledForInsufficientFunds: 0,
    };

    for (const subscription of subscriptionsDue) {
      try {
        const lipzAmount = Number(subscription.tier.pricePerMonth);

        if (!Number.isInteger(lipzAmount) || lipzAmount <= 0) {
          throw new Error("Invalid tier pricePerMonth");
        }

        // Try auto-top-up if low
        let wallet = await prisma.wallet.findUnique({
          where: { userId: subscription.userId },
        });

        if (!wallet || wallet.lipzBalance < lipzAmount) {
          if (wallet?.autoTopUpEnabled) {
            const topUpResult = await attemptAutoTopUp(subscription.userId, lipzAmount);
            if (topUpResult.success) {
              results.autoTopUps++;
              wallet = await prisma.wallet.findUnique({
                where: { userId: subscription.userId },
              });
            }
          }
        }

        if (!wallet || wallet.lipzBalance < lipzAmount) {
          await prisma.userSubscription.update({
            where: { id: subscription.id },
            data: {
              status: "CANCELLED",
              cancelledAt: now,
              updatedAt: now,
            },
          });
          results.failed++;
          results.cancelledForInsufficientFunds++;
          continue;
        }

        // ✅ 1 Lipz = 1 cent
        const platformFeeCents = Math.floor((lipzAmount * feePercent) / 100);
        const creatorNetCents = lipzAmount - platformFeeCents;

        const periodStart = subscription.currentPeriodEnd;
        const periodEnd = addDays(subscription.currentPeriodEnd, 30);

        const subscriptionPaymentId = crypto.randomUUID();

        await prisma.$transaction(async (tx) => {
          // Race-safe debit
          const dec = await tx.wallet.updateMany({
            where: { userId: subscription.userId, lipzBalance: { gte: lipzAmount } },
            data: { lipzBalance: { decrement: lipzAmount } },
          });

          if (dec.count !== 1) {
            // If debit fails in-transaction, cancel subscription to avoid infinite retries
            await tx.userSubscription.update({
              where: { id: subscription.id },
              data: {
                status: "CANCELLED",
                cancelledAt: now,
                updatedAt: now,
              },
            });
            throw new Error("INSUFFICIENT_LIPZ");
          }

          // Update subscription period + totalPaid
          await tx.userSubscription.update({
            where: { id: subscription.id },
            data: {
              currentPeriodStart: periodStart,
              currentPeriodEnd: periodEnd,
              totalPaid: { increment: lipzAmount },
              updatedAt: now,
            },
          });

          // Record payment (domain)
          await tx.subscriptionPayment.create({
            data: {
              id: subscriptionPaymentId,
              subscriptionId: subscription.id,
              userId: subscription.userId,
              creatorId: subscription.creatorId,
              tierId: subscription.tierId,
              lipzAmount,
              amountCents: lipzAmount,
              platformFeeCents,
              creatorNetCents,
              periodStart,
              periodEnd,
              status: "SUCCESS",
              // paidAt/createdAt default in DB
            },
          });

          // Credit creator earnings (upsert in case wallet doesn't exist)
          await tx.wallet.upsert({
            where: { userId: subscription.creatorId },
            create: {
              userId: subscription.creatorId,
              lipzBalance: 0,
              earningsCents: creatorNetCents,
              currency: "USD",
            },
            update: { earningsCents: { increment: creatorNetCents } },
          });

          // Ledger transaction
          await tx.transaction.create({
            data: {
              userId: subscription.userId,
              creatorId: subscription.creatorId,
              type: "SUBSCRIPTION_PAYMENT",
              lipzAmount,
              amountCents: lipzAmount,
              platformFeeCents,
              creatorNetCents,
              metadata: {
                renewal: true,
                subscriptionId: subscription.id,
                subscriptionPaymentId,
                tierId: subscription.tierId,
                periodStart,
                periodEnd,
              },
            },
          });
        });

        results.successful++;
      } catch (err) {
        // If we threw INSUFFICIENT_LIPZ inside tx, it already cancelled.
        if (err?.message === "INSUFFICIENT_LIPZ") {
          results.failed++;
          results.cancelledForInsufficientFunds++;
          continue;
        }

        console.error(`Failed to renew subscription ${subscription.id}:`, err);
        results.failed++;
      }
    }

    return res.status(200).json({
      success: true,
      message: "Subscription renewals processed",
      results,
    });
  } catch (err) {
    console.error("Cron job error:", err);
    return res.status(500).json({ error: "Cron job failed" });
  }
}
