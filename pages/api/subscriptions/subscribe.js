import { createClient } from '@supabase/supabase-js';
import { prisma } from '../../../lib/prisma';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.replace('Bearer ', '') || 
                req.cookies['sb-access-token'];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { tierId } = req.body;

  if (!tierId) {
    return res.status(400).json({ error: 'Tier ID required' });
  }

  try {
    const tier = await prisma.subscriptionTier.findUnique({
      where: { id: tierId },
    });

    if (!tier || !tier.isActive) {
      return res.status(404).json({ error: 'Tier not found or inactive' });
    }

    if (tier.creatorId === user.id) {
      return res.status(400).json({ error: "You can't subscribe to yourself" });
    }

    // Check if already subscribed to this creator
    const existing = await prisma.userSubscription.findUnique({
      where: {
        userId_creatorId: {
          userId: user.id,
          creatorId: tier.creatorId,
        },
      },
    });

    if (existing && existing.status === 'ACTIVE') {
      return res.status(400).json({ error: 'Already subscribed to this creator' });
    }

    const now = new Date();
    const trialEndsAt = tier.trialDays > 0 
      ? new Date(now.getTime() + tier.trialDays * 24 * 60 * 60 * 1000)
      : null;
    
    const firstChargeDate = trialEndsAt || now;
    const periodEnd = new Date(firstChargeDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    // If no trial, charge immediately
    if (!trialEndsAt) {
      let wallet = await prisma.wallet.findUnique({
        where: { userId: user.id },
      });

      // AUTO-TOP-UP LOGIC
      if (!wallet || wallet.lipzBalance < tier.pricePerMonth) {
        const autoTopUpResult = await attemptAutoTopUp(user.id, tier.pricePerMonth);
        
        if (autoTopUpResult.success) {
          // Reload wallet after auto-top-up
          wallet = await prisma.wallet.findUnique({
            where: { userId: user.id },
          });
        } else {
          return res.status(400).json({ 
            error: 'Insufficient Lipz balance',
            required: tier.pricePerMonth,
            current: wallet?.lipzBalance || 0,
            autoTopUpFailed: wallet?.autoTopUpEnabled || false,
          });
        }
      }

      // Double check we have enough after auto-top-up
      if (wallet.lipzBalance < tier.pricePerMonth) {
        return res.status(400).json({ 
          error: 'Insufficient Lipz balance even after auto-top-up',
          required: tier.pricePerMonth,
          current: wallet.lipzBalance,
        });
      }

      // Calculate fees
      const platformFeeCents = Math.floor((tier.pricePerMonth * 0.10) * 100);
      const creatorNetCents = Math.floor(tier.pricePerMonth * 0.90 * 100);

      // Create subscription and process first payment
      const [subscription, payment, updatedBuyerWallet, updatedCreatorWallet] = await prisma.$transaction([
        // Create subscription
        prisma.userSubscription.create({
          data: {
            userId: user.id,
            tierId: tier.id,
            creatorId: tier.creatorId,
            status: 'ACTIVE',
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            totalPaid: tier.pricePerMonth,
          },
        }),
        
        // Record payment
        prisma.subscriptionPayment.create({
          data: {
            subscriptionId: '', // Will be updated
            userId: user.id,
            creatorId: tier.creatorId,
            tierId: tier.id,
            lipzAmount: tier.pricePerMonth,
            amountCents: tier.pricePerMonth * 100,
            platformFeeCents,
            creatorNetCents,
            periodStart: now,
            periodEnd,
            status: 'SUCCESS',
          },
        }),
        
        // Deduct from buyer
        prisma.wallet.update({
          where: { userId: user.id },
          data: {
            lipzBalance: {
              decrement: tier.pricePerMonth,
            },
          },
        }),
        
        // Add to creator earnings
        prisma.wallet.upsert({
          where: { userId: tier.creatorId },
          create: {
            userId: tier.creatorId,
            lipzBalance: 0,
            earningsCents: creatorNetCents,
          },
          update: {
            earningsCents: {
              increment: creatorNetCents,
            },
          },
        }),
      ]);

      // Update payment with subscription ID
      await prisma.subscriptionPayment.update({
        where: { id: payment.id },
        data: { subscriptionId: subscription.id },
      });

      return res.status(200).json({
        success: true,
        subscription,
        message: 'Subscribed successfully! First payment processed.',
        newBalance: updatedBuyerWallet.lipzBalance,
      });
    } else {
      // Free trial - no payment yet
      const subscription = await prisma.userSubscription.create({
        data: {
          userId: user.id,
          tierId: tier.id,
          creatorId: tier.creatorId,
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          trialEndsAt,
        },
      });

      return res.status(200).json({
        success: true,
        subscription,
        message: `Free trial started! ${tier.trialDays} days free.`,
      });
    }
  } catch (err) {
    console.error('Error subscribing:', err);
    return res.status(500).json({ error: 'Failed to subscribe' });
  }
}