import { prisma } from '../../../../lib/prisma';
import { withAuth } from '../../../../lib/auth-middleware';

export default withAuth(async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { creatorId } = req.query;

  if (!creatorId) {
    return res.status(400).json({ ok: false, error: 'Creator ID required' });
  }

  try {
    const bundles = await prisma.bundle.findMany({
      where: {
        creatorId,
        isActive: true,
      },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { purchases: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ ok: true, data: bundles });
  } catch (err) {
    console.error('Error fetching bundles:', err);
    return res.status(500).json({ ok: false, error: 'Failed to fetch bundles' });
  }
});