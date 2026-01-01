import { createClient } from '@supabase/supabase-js';
import { prisma } from '../../../lib/prisma';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { bundleId } = req.query;

  if (!bundleId) {
    return res.status(400).json({ error: 'Bundle ID required' });
  }

  // Optional: Check if user has purchased
  const token = req.headers.authorization?.replace('Bearer ', '') || 
                req.cookies['sb-access-token'];

  let userId = null;
  let hasPurchased = false;

  if (token) {
    const { data: { user } } = await supabase.auth.getUser(token);
    if (user) {
      userId = user.id;
      
      // Check if user purchased this bundle
      const purchase = await prisma.bundlePurchase.findUnique({
        where: {
          bundleId_userId: {
            bundleId,
            userId,
          },
        },
      });
      
      hasPurchased = !!purchase;
    }
  }

  try {
    const bundle = await prisma.bundle.findUnique({
      where: { id: bundleId },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { purchases: true },
        },
      },
    });

    if (!bundle) {
      return res.status(404).json({ error: 'Bundle not found' });
    }

    // If user hasn't purchased, don't return full item details
    if (!hasPurchased && bundle.creatorId !== userId) {
      return res.status(200).json({
        ...bundle,
        items: bundle.items.map(item => ({
          id: item.id,
          mediaType: item.mediaType,
          order: item.order,
          // Don't reveal mediaId until purchased
        })),
        hasPurchased: false,
      });
    }

    return res.status(200).json({
      ...bundle,
      hasPurchased,
    });
  } catch (err) {
    console.error('Error fetching bundle:', err);
    return res.status(500).json({ error: 'Failed to fetch bundle' });
  }
}