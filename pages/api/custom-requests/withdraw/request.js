import { withAuth } from "../../../lib/auth-middleware.js";
import { prisma } from '../../../lib/prisma';

export default withAuth(async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const userId = req.user.id;
  const { amountCents, paymentMethod, paymentDetails } = req.body;

  if (!amountCents || amountCents <= 0) {
    return res.status(400).json({ ok: false, error: 'Invalid amount' });
  }

  if (!paymentMethod || !paymentDetails) {
    return res.status(400).json({ ok: false, error: 'Payment method and details required' });
  }

  // Minimum withdrawal: $10
  if (amountCents < 1000) {
    return res.status(400).json({ ok: false, error: 'Minimum withdrawal is $10.00' });
  }

  try {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet || wallet.earningsCents < amountCents) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Insufficient earnings balance',
        required: amountCents,
        current: wallet?.earningsCents || 0,
      });
    }

    // Create withdrawal and deduct from earnings
    const [withdrawal, updatedWallet] = await prisma.$transaction([
      prisma.withdrawal.create({
        data: {
          userId,
          amountCents: parseInt(amountCents),
          paymentMethod,
          paymentDetails,
          status: 'PENDING',
        },
      }),
      
      prisma.wallet.update({
        where: { userId },
        data: {
          earningsCents: {
            decrement: parseInt(amountCents),
          },
        },
      }),
    ]);

    return res.status(200).json({ 
      ok: true, 
      data: { 
        withdrawal,
        newBalance: updatedWallet.earningsCents,
      }
    });
  } catch (err) {
    console.error('Error creating withdrawal:', err);
    return res.status(500).json({ ok: false, error: 'Failed to request withdrawal' });
  }
});