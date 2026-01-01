import { prisma } from '../../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { squadId } = req.query;
    const { messageId, userId, emoji } = req.body;

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
      return res.status(200).json({ removed: true });
    }

    // Add reaction
    const reaction = await prisma.messageReaction.create({
      data: {
        messageId,
        userId,
        emoji,
      },
    });

    return res.status(200).json(reaction);
  } catch (error) {
    console.error('Reaction error:', error);
    return res.status(500).json({ error: 'Failed to add reaction' });
  }
}