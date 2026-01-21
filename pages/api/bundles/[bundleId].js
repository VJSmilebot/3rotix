import { withAuth } from "../../../lib/auth-middleware.js";
import { createSupabaseServerClient } from "../../../utils/supabase/server.js";
import { prisma } from "../../../lib/prisma.js";

export default withAuth(async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { bundleId } = req.query;

  if (!bundleId) {
    return res.status(400).json({ ok: false, error: 'Bundle ID required' });
  }

  const userId = req.user?.id;

  try {
    const supabase = createSupabaseServerClient(req, res);
    
    // Optional: Check if user has purchased
    let hasPurchased = false;

    if (userId) {
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
      return res.status(404).json({ ok: false, error: 'Bundle not found' });
    }

    // If user hasn't purchased, don't return full item details
    if (!hasPurchased && bundle.creatorId !== userId) {
      return res.status(200).json({
        ok: true,
        data: {
          ...bundle,
          items: bundle.items.map(item => ({
            id: item.id,
            mediaType: item.mediaType,
            order: item.order,
            // Don't reveal mediaId until purchased
          })),
          hasPurchased: false,
        },
      });
    }

    return res.status(200).json({
      ok: true,
      data: {
        ...bundle,
        hasPurchased,
      },
    });
  } catch (err) {
    console.error('Error fetching bundle:', err);
    return res.status(500).json({ ok: false, error: 'Failed to fetch bundle' });
  }
});
