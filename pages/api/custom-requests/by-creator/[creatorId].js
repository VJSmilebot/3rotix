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
    const requests = await prisma.customRequest.findMany({
      where: {
        creatorId,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json(requests);
  } catch (err) {
    console.error('Error fetching requests:', err);
    return res.status(500).json({ error: 'Failed to fetch requests' });
  }
}