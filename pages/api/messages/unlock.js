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

  const { conversationId } = req.body;

  if (!conversationId) {
    return res.status(400).json({ error: 'Conversation ID required' });
  }

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (conversation.isUnlocked) {
      return res.status(400).json({ error: 'Already unlocked' });
    }

    if (!conversation.unlockPrice) {
      return res.status(400).json({ error: 'No unlock required' });
    }

    // Get wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
    });

    if (!wallet || wallet.lipzBalance < conversation.unlockPrice) {
      return res.status(400).json({ 
        error: 'Insufficient Lipz balance',
        required: conversation.unlockPrice,
        current: wallet?.lipzBalance || 0,
      });
    }

    const creatorId = conversation.participant1Id === user.id 
      ? conversation.participant2Id 
      : conversation.participant1Id;

    const platformFeeCents = Math.floor((conversation.unlockPrice * 0.10) * 100);
    const creatorNetCents = Math.floor(conversation.unlockPrice * 0.90 * 100);

    // Process unlock payment
    const [updatedConversation, , updatedBuyerWallet, updatedCreatorWallet] = await prisma.$transaction([
      prisma.conversation.update({
        where: { id: conversationId },
        data: {
          isUnlocked: true,
          unlockedAt: new Date(),
        },
      }),

      prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'DM_UNLOCK',
          lipzAmount: conversation.unlockPrice,
          amountCents: conversation.unlockPrice * 100,
          platformFeeCents,
          creatorNetCents,
          metadata: {
            conversationId,
            creatorId,
          },
        },
      }),

      prisma.wallet.update({
        where: { userId: user.id },
        data: {
          lipzBalance: {
            decrement: conversation.unlockPrice,
          },
        },
      }),

      prisma.wallet.update({
        where: { userId: creatorId },
        data: {
          earningsCents: {
            increment: creatorNetCents,
          },
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      conversation: updatedConversation,
      newBalance: updatedBuyerWallet.lipzBalance,
    });
  } catch (err) {
    console.error('Error unlocking conversation:', err);
    return res.status(500).json({ error: 'Failed to unlock conversation' });
  }
}