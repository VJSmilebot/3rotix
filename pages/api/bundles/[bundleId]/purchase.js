import { prisma } from '../../../../lib/prisma';
import { withAuth } from '../../../../lib/auth-middleware';

export default withAuth(async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { bundleId } = req.query;
  const userId = req.user.id;

  if (!bundleId || typeof bundleId !== 'string') {
    return res.status(400).json({ ok: false, error: 'Bundle ID required' });
  }

  try {
    // Get bundle details
    const bundle = await prisma.bundle.findUnique({
      where: { id: bundleId },
    });

    if (!bundle) {
      return res.status(404).json({ ok: false, error: 'Bundle not found' });
    }

    if (!bundle.isActive) {
      return res.status(400).json({ ok: false, error: 'Bundle is not available' });
    }

    if (bundle.creatorId === userId) {
      return res.status(400).json({ ok: false, error: "You can't purchase your own bundle" });
    }

    // Already purchased?
    const existingPurchase = await prisma.bundlePurchase.findUnique({
      where: {
        bundleId_userId: { bundleId, userId },
      },
    });

    if (existingPurchase) {
      return res.status(400).json({ ok: false, error: 'You already own this bundle' });
    }

    // Ensure buyer wallet exists
    let wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId, lipzBalance: 0, earningsCents: 0, currency: 'USD' },
      });
    }

    const lipzAmount = Number(bundle.price);
    if (!Number.isInteger(lipzAmount) || lipzAmount <= 0) {
      return res.status(400).json({ ok: false, error: 'Invalid bundle price' });
    }

    // Platform fee percent (fallback 10)
    const settings = await prisma.platformSettings.findUnique({
      where: { id: 'default' },
      select: { globalplatformcutpercent: true },
    });

    const feePercent = Number(settings?.globalplatformcutpercent ?? 10);

    // ✅ 1 Lipz = 1 cent → cents math uses Lipz directly
    const platformFeeCents = Math.floor((lipzAmount * feePercent) / 100);
    const creatorNetCents = lipzAmount - platformFeeCents;

    const result = await prisma.$transaction(async (tx) => {
      // Create purchase record FIRST (unique constraint will protect duplicates)
      const purchase = await tx.bundlePurchase.create({
        data: {
          bundleId,
          userId,
          lipzPaid: lipzAmount,
        },
      });

      // Race-safe debit
      const dec = await tx.wallet.updateMany({
        where: { userId, lipzBalance: { gte: lipzAmount } },
        data: { lipzBalance: { decrement: lipzAmount } },
      });

      if (dec.count !== 1) {
        // If debit fails, throw to rollback purchase record
        throw new Error('INSUFFICIENT_LIPZ');
      }

      // Credit creator earnings
      await tx.wallet.upsert({
        where: { userId: bundle.creatorId },
        create: {
          userId: bundle.creatorId,
          lipzBalance: 0,
          earningsCents: creatorNetCents,
          currency: 'USD',
        },
        update: {
          earningsCents: { increment: creatorNetCents },
        },
      });

      // Ledger transaction
      await tx.transaction.create({
        data: {
          userId,
          creatorId: bundle.creatorId,
          type: 'BUNDLE_PURCHASE',
          lipzAmount: lipzAmount,
          amountCents: lipzAmount, // ✅ 1 Lipz = 1 cent
          platformFeeCents,
          creatorNetCents,
          metadata: {
            bundleId,
            bundleTitle: bundle.title,
          },
        },
      });

      const updatedBuyerWallet = await tx.wallet.findUnique({ where: { userId } });

      return { purchase, updatedBuyerWallet };
    });

    return res.status(200).json({
      ok: true,
      success: true,
      purchase: result.purchase,
      newBalance: result.updatedBuyerWallet?.lipzBalance ?? 0,
      bundle,
    });
  } catch (err) {
    if (err?.message === 'INSUFFICIENT_LIPZ') {
      return res.status(400).json({
        ok: false,
        error: 'Insufficient Lipz balance',
      });
    }

    // Prisma unique constraint on BundlePurchase(bundleId,userId)
    if (err?.code === 'P2002') {
      return res.status(400).json({ ok: false, error: 'You already own this bundle' });
    }

    console.error('Error purchasing bundle:', err);
    return res.status(500).json({ ok: false, error: 'Failed to purchase bundle' });
  }
});
