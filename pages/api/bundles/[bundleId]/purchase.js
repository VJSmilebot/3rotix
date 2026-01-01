import { createClient } from '@supabase/supabase-js';
import { prisma } from '../../../../lib/prisma';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

  const { bundleId } = req.query;

  if (!bundleId) {
    return res.status(400).json({ error: 'Bundle ID required' });
  }

  try {
    // Get bundle details
    const bundle = await prisma.bundle.findUnique({
      where: { id: bundleId },
    });

    if (!bundle) {
      return res.status(404).json({ error: 'Bundle not found' });
    }

    if (!bundle.isActive) {
      return res.status(400).json({ error: 'Bundle is not available' });
    }

    // Can't buy your own bundle
    if (bundle.creatorId === user.id) {
      return res.status(400).json({ error: "You can't purchase your own bundle" });
    }

    // Check if already purchased
    const existingPurchase = await prisma.bundlePurchase.findUnique({
      where: {
        bundleId_userId: {
          bundleId,
          userId: user.id,
        },
      },
    });

    if (existingPurchase) {
      return res.status(400).json({ error: 'You already own this bundle' });
    }

    // Get user's wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
    });

    if (!wallet || wallet.lipzBalance < bundle.price) {
      return res.status(400).json({ 
        error: 'Insufficient Lipz balance',
        required: bundle.price,
        current: wallet?.lipzBalance || 0,
      });
    }

    // Calculate platform fee (10%)
    const platformFeeCents = Math.floor((bundle.price * 0.10) * 100); // Convert Lipz to cents, then take 10%
    const creatorNetCents = Math.floor(bundle.price * 0.90 * 100); // 90% to creator

    // Execute purchase in transaction
    const [purchase, updatedBuyerWallet, updatedCreatorWallet, transaction] = await prisma.$transaction([
      // Create purchase record
      prisma.bundlePurchase.create({
        data: {
          bundleId,
          userId: user.id,
          lipzPaid: bundle.price,
        },
      }),
      
      // Deduct Lipz from buyer
      prisma.wallet.update({
        where: { userId: user.id },
        data: {
          lipzBalance: {
            decrement: bundle.price,
          },
        },
      }),
      
      // Add earnings to creator's wallet
      prisma.wallet.upsert({
        where: { userId: bundle.creatorId },
        create: {
          userId: bundle.creatorId,
          lipzBalance: 0,
          earningsCents: creatorNetCents,
        },
        update: {
          earningsCents: {
            increment: creatorNetCents,
          },
        },
      }),
      
      // Log transaction
      prisma.transaction.create({
        data: {
          userId: user.id,
          creatorId: bundle.creatorId,
          type: 'BUNDLE_PURCHASE',
          lipzAmount: bundle.price,
          amountCents: bundle.price * 100, // Convert to cents
          platformFeeCents,
          creatorNetCents,
          metadata: {
            bundleId,
            bundleTitle: bundle.title,
          },
        },
      }),
    ]);

    // TODO: Send notification to creator about purchase
    // TODO: Award XP for purchase

    return res.status(200).json({
      success: true,
      purchase,
      newBalance: updatedBuyerWallet.lipzBalance,
      bundle,
    });
  } catch (err) {
    console.error('Error purchasing bundle:', err);
    return res.status(500).json({ error: 'Failed to purchase bundle' });
  }
}