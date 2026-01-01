import { prisma } from '../../../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { creatorId } = req.query;

  if (!creatorId) {
    return res.status(400).json({ error: 'Creator ID required' });
  }

  try {
    const tiers = await prisma.subscriptionTier.findMany({
      where: {
        creatorId,
        isActive: true,
      },
      include: {
        _count: {
          select: { subscribers: true },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });

    return res.status(200).json(tiers);
  } catch (err) {
    console.error('Error fetching tiers:', err);
    return res.status(500).json({ error: 'Failed to fetch tiers' });
  }
}