import { prisma } from '../../../../lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Internal/cron only
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.INTERNAL_API_KEY) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { userId, requiredLipz } = req.body;

  if (!userId || typeof requiredLipz !== 'number') {
    return res.status(400).json({ error: 'userId and requiredLipz required' });
  }

  if (requiredLipz <= 0) {
    return res.status(400).json({ error: 'requiredLipz must be > 0' });
  }

  try {
    const wallet = await prisma.wallet.findUnique({ where: { userId } });

    if (!wallet || !wallet.autoTopUpEnabled) {
      return res.status(400).json({ error: 'Auto-top-up not enabled' });
    }

    if (!wallet.stripeCustomerId || !wallet.stripePaymentMethodId) {
      return res.status(400).json({ error: 'No payment method saved' });
    }

    const currentBalance = wallet.lipzBalance;
    const needed = requiredLipz - currentBalance;

    if (needed <= 0) {
      return res.status(200).json({
        success: true,
        lipzAdded: 0,
        newBalance: currentBalance,
        message: 'No top-up needed',
      });
    }

    // Buy configured amount or what's needed (whichever is higher)
    const lipzToBuy = Math.max(needed, wallet.autoTopUpAmount);

    // ✅ RULE: 1 Lipz = 1 cent
    const amountCents = lipzToBuy;

    // Charge via Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      customer: wallet.stripeCustomerId,
      payment_method: wallet.stripePaymentMethodId,
      off_session: true,
      confirm: true,
      description: `Auto-top-up: ${lipzToBuy} Lipz`,
      metadata: {
        userId,
        lipzAmount: String(lipzToBuy),
        type: 'AUTO_TOPUP',
      },
    });

    if (paymentIntent.status !== 'succeeded') {
      throw new Error(`Payment failed: ${paymentIntent.status}`);
    }

    // ✅ Atomic credit + log
    const updatedWallet = await prisma.$transaction(async (tx) => {
      const w = await tx.wallet.update({
        where: { userId },
        data: { lipzBalance: { increment: lipzToBuy } },
      });

      await tx.transaction.create({
        data: {
          userId,
          type: 'LOAD_LIPZ_REAL', // ✅ matches your enum
          lipzAmount: lipzToBuy,
          amountCents: amountCents,
          platformFeeCents: 0,
          creatorNetCents: 0,
          metadata: {
            stripePaymentIntentId: paymentIntent.id,
            autoTopUp: true,
          },
        },
      });

      return w;
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
