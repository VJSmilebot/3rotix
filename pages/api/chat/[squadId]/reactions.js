import { prisma } from '../../../../lib/prisma';
import { withAuth } from '../../../../lib/auth-middleware';

export default withAuth(async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { squadId } = req.query;
    const { messageId, emoji } = req.body;
    const userId = req.user.id;

    if (!messageId || !emoji) {
      return res.status(400).json({ ok: false, error: 'Missing messageId or emoji' });
    }

    // Check if reaction already exists
    const existing = await prisma.messageReaction.findFirst({
      where: {
        messageId,
        userId,
        emoji,
      },
    });

    if (existing) {
      // Remove reaction (toggle off)
      await prisma.messageReaction.delete({
        where: { id: existing.id },
      });
      return res.status(200).json({ ok: true, removed: true });
    }

    // Add reaction
    const reaction = await prisma.messageReaction.create({
      data: {
        messageId,
        userId,
        emoji,
      },
    });

    return res.status(200).json({ ok: true, data: reaction });
  } catch (error) {
    console.error('Reaction error:', error);
    return res.status(500).json({ ok: false, error: 'Failed to add reaction' });
  }
});