import { prisma } from '../../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { creatorId } = req.query;

  if (!creatorId) {
    return res.status(400).json({ error: 'Creator ID required' });
  }

  try {
    const events = await prisma.eventTicket.findMany({
      where: {
        creatorId,
        isActive: true,
      },
      include: {
        _count: {
          select: { purchases: true },
        },
      },
      orderBy: { eventDate: 'asc' },
    });

    return res.status(200).json(events);
  } catch (err) {
    console.error('Error fetching events:', err);
    return res.status(500).json({ error: 'Failed to fetch events' });
  }
}