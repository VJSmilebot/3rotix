import { createClient } from '@supabase/supabase-js';
import { prisma } from '../../../../lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // This endpoint should be called internally or via cron job
  // For security, add an API key check
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.INTERNAL_API_KEY) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { userId, requiredLipz } = req.body;

  if (!userId || !requiredLipz) {
    return res.status(400).json({ error: 'userId and requiredLipz required' });
  }

  try {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet || !wallet.autoTopUpEnabled) {
      return res.status(400).json({ error: 'Auto-top-up not enabled' });
    }

    if (!wallet.stripeCustomerId || !wallet.stripePaymentMethodId) {
      return res.status(400).json({ error: 'No payment method saved' });
    }

    // Calculate how many Lipz to buy
    const currentBalance = wallet.lipzBalance;
    const needed = requiredLipz - currentBalance;
    
    // Buy the configured amount or what's needed (whichever is higher)
    const lipzToBuy = Math.max(needed, wallet.autoTopUpAmount);
    const amountCents = lipzToBuy * 100; // $1 = 100 Lipz

    // Charge via Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      customer: wallet.stripeCustomerId,
      payment_method: wallet.stripePaymentMethodId,
      off_session: true,
      confirm: true,
      description: `Auto-top-up: ${lipzToBuy} Lipz for subscription renewal`,
      metadata: {
        userId,
        lipzAmount: lipzToBuy,
        type: 'AUTO_TOPUP',
      },
    });

    if (paymentIntent.status !== 'succeeded') {
      throw new Error('Payment failed');
    }

    // Add Lipz to wallet
    const updatedWallet = await prisma.wallet.update({
      where: { userId },
      data: {
        lipzBalance: {
          increment: lipzToBuy,
        },
      },
    });

    // Log transaction
    await prisma.transaction.create({
      data: {
        userId,
        type: 'LIPZ_PURCHASE',
        lipzAmount: lipzToBuy,
        amountCents,
        platformFeeCents: 0,
        creatorNetCents: 0,
        metadata: {
          stripePaymentIntentId: paymentIntent.id,
          autoTopUp: true,
        },
      },
    });

    return res.status(200).json({
      success: true,
      lipzAdded: lipzToBuy,
      newBalance: updatedWallet.lipzBalance,
      paymentIntentId: paymentIntent.id,
    });
  } catch (err) {
    console.error('Auto-top-up error:', err);
    return res.status(500).json({ 
      error: 'Auto-top-up failed',
      details: err.message,
    });
  }
}