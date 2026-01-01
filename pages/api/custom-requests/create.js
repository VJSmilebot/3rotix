import { createClient } from '@supabase/supabase-js';
import { prisma } from '../../../lib/prisma';

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

  const { creatorId, title, description, budget } = req.body;

  if (!creatorId || !title || !description || !budget || budget <= 0) {
    return res.status(400).json({ error: 'All fields required with valid budget' });
  }

  if (creatorId === user.id) {
    return res.status(400).json({ error: "You can't request from yourself" });
  }

  try {
    // Check user's wallet balance
    const wallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
    });

    if (!wallet || wallet.lipzBalance < parseInt(budget)) {
      return res.status(400).json({ 
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
          requesterId: user.id,
          title,
          description,
          budget: parseInt(budget),
          escrowLipz: parseInt(budget),
          status: 'PENDING',
        },
      }),
      
      // Deduct from requester's balance (held in escrow)
      prisma.wallet.update({
        where: { userId: user.id },
        data: {
          lipzBalance: {
            decrement: parseInt(budget),
          },
        },
      }),
    ]);

    return res.status(200).json({ 
      success: true, 
      request,
      newBalance: updatedWallet.lipzBalance,
    });
  } catch (err) {
    console.error('Error creating custom request:', err);
    return res.status(500).json({ error: 'Failed to create request' });
  }
}