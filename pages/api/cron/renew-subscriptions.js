import { prisma } from '../../../lib/prisma';

async function attemptAutoTopUp(userId, requiredLipz) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/wallet/auto-topup/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.INTERNAL_API_KEY,
      },
      body: JSON.stringify({ userId, requiredLipz }),
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    }
    return { success: false };
  } catch (err) {
    console.error('Auto-top-up attempt failed:', err);
    return { success: false };
  }
}

export default async function handler(req, res) {
  // Security: Only allow cron job or internal API key
  const cronSecret = req.headers['x-cron-secret'];
  if (cronSecret !== process.env.CRON_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const now = new Date();
    
    // Find all subscriptions that need renewal
    const subscriptionsDue = await prisma.userSubscription.findMany({
      where: {
        status: 'ACTIVE',
        currentPeriodEnd: {
          lte: now,
        },
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
    };

    for (const subscription of subscriptionsDue) {
      try {
        let wallet = await prisma.wallet.findUnique({
          where: { userId: subscription.userId },
        });

        // Try auto-top-up if insufficient balance
        if (!wallet || wallet.lipzBalance < subscription.tier.pricePerMonth) {
          if (wallet?.autoTopUpEnabled) {
            const topUpResult = await attemptAutoTopUp(subscription.userId, subscription.tier.pricePerMonth);
            
            if (topUpResult.success) {
              results.autoTopUps++;
              // Reload wallet
              wallet = await prisma.wallet.findUnique({
                where: { userId: subscription.userId },
              });
            }
          }
        }

        // Check if we have enough after potential auto-top-up
        if (!wallet || wallet.lipzBalance < subscription.tier.pricePerMonth) {
          // Insufficient funds - cancel subscription
          await prisma.userSubscription.update({
            where: { id: subscription.id },
            data: {
              status: 'CANCELLED',
              cancelledAt: now,
            },
          });
          
          results.failed++;
          continue;
        }

        // Process renewal payment
        const platformFeeCents = Math.floor((subscription.tier.pricePerMonth * 0.10) * 100);
        const creatorNetCents = Math.floor(subscription.tier.pricePerMonth * 0.90 * 100);
        
        const newPeriodEnd = new Date(subscription.currentPeriodEnd.getTime() + 30 * 24 * 60 * 60 * 1000);

        await prisma.$transaction([
          // Update subscription
          prisma.userSubscription.update({
            where: { id: subscription.id },
            data: {
              currentPeriodStart: subscription.currentPeriodEnd,
              currentPeriodEnd: newPeriodEnd,
              totalPaid: {
                increment: subscription.tier.pricePerMonth,
              },
            },
          }),
          
          // Record payment
          prisma.subscriptionPayment.create({
            data: {
              subscriptionId: subscription.id,
              userId: subscription.userId,
              creatorId: subscription.creatorId,
              tierId: subscription.tierId,
              lipzAmount: subscription.tier.pricePerMonth,
              amountCents: subscription.tier.pricePerMonth * 100,
              platformFeeCents,
              creatorNetCents,
              periodStart: subscription.currentPeriodEnd,
              periodEnd: newPeriodEnd,
              status: 'SUCCESS',
            },
          }),
          
          // Deduct from subscriber
          prisma.wallet.update({
            where: { userId: subscription.userId },
            data: {
              lipzBalance: {
                decrement: subscription.tier.pricePerMonth,
              },
            },
          }),
          
          // Add to creator earnings
          prisma.wallet.update({
            where: { userId: subscription.creatorId },
            data: {
              earningsCents: {
                increment: creatorNetCents,
              },
            },
          }),
        ]);

        results.successful++;
      } catch (err) {
        console.error(`Failed to renew subscription ${subscription.id}:`, err);
        results.failed++;
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Subscription renewals processed',
      results,
    });
  } catch (err) {
    console.error('Cron job error:', err);
    return res.status(500).json({ error: 'Cron job failed' });
  }
}