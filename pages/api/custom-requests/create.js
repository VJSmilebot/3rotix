import { prisma } from '../../../lib/prisma';
import { withAuth } from '../../../lib/auth-middleware';

export default withAuth(async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const userId = req.user.id;
  const { creatorId, title, description, budget } = req.body || {};

  if (!creatorId || !title || !description || !budget || budget <= 0) {
    return res.status(400).json({ ok: false, error: 'All fields required with valid budget' });
  }

  if (creatorId === userId) {
    return res.status(400).json({ ok: false, error: "You can't request from yourself" });
  }

  try {
    // Check user's wallet balance
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet || wallet.lipzBalance < parseInt(budget)) {
      return res.status(400).json({ 
        ok: false,
        error: 'Insufficient Lipz balance',
        required: parseInt(budget),
        current: wallet?.lipzBalance || 0,
      });
    }

    // Create request and put Lipz in escrow
    const [request, updatedWallet] = await prisma.$transaction([
      prisma.customRequest.create({
        data: {
          creatorId,
          requesterId: userId,
          title,
          description,
          budget: parseInt(budget),
          escrowLipz: parseInt(budget),
          status: 'PENDING',
        },
      }),
      
      // Deduct from requester's balance (held in escrow)
      prisma.wallet.update({
        where: { userId },
        data: {
          lipzBalance: {
            decrement: parseInt(budget),
          },
        },
      }),
    ]);

    return res.status(200).json({ 
      ok: true, 
      data: { 
        success: true, 
        request,
        newBalance: updatedWallet.lipzBalance,
      }
    });
  } catch (err) {
    console.error('Error creating custom request:', err);
    return res.status(500).json({ ok: false, error: 'Failed to create request' });
  }
});
