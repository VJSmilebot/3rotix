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

  const { requestId } = req.query;
  const { deliveryUrl, message } = req.body;

  if (!deliveryUrl) {
    return res.status(400).json({ error: 'Delivery URL required' });
  }

  try {
    const request = await prisma.customRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.creatorId !== user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (request.status !== 'ACCEPTED' && request.status !== 'IN_PROGRESS') {
      return res.status(400).json({ error: 'Request is not in progress' });
    }

    // Calculate fees
    const platformFeeCents = Math.floor((request.escrowLipz * 0.10) * 100);
    const creatorNetCents = Math.floor(request.escrowLipz * 0.90 * 100);

    // Release escrow to creator
    const [updatedRequest, updatedCreatorWallet, transaction] = await prisma.$transaction([
      prisma.customRequest.update({
        where: { id: requestId },
        data: {
          status: 'COMPLETED',
          deliveryUrl,
          creatorMessage: message,
          completedAt: new Date(),
        },
      }),
      
      prisma.wallet.upsert({
        where: { userId: request.creatorId },
        create: {
          userId: request.creatorId,
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
          userId: request.requesterId,
          creatorId: request.creatorId,
          type: 'CUSTOM_REQUEST',
          lipzAmount: request.escrowLipz,
          amountCents: request.escrowLipz * 100,
          platformFeeCents,
          creatorNetCents,
          metadata: {
            customRequestId: requestId,
            requestTitle: request.title,
          },
        },
      }),
    ]);

    return res.status(200).json({ success: true, request: updatedRequest });
  } catch (err) {
    console.error('Error completing request:', err);
    return res.status(500).json({ error: 'Failed to complete request' });
  }
}