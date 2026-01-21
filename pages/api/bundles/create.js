import { withAuth } from "../../../lib/auth-middleware.js";
import { prisma } from "../../../lib/prisma.js";

export default withAuth(async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  const { title, description, coverImage, price, type, items } = req.body;

  if (!title || !price || price <= 0) {
    return res.status(400).json({ ok: false, error: 'Title and valid price required' });
  }

  if (!items || items.length === 0) {
    return res.status(400).json({ ok: false, error: 'Bundle must contain at least one item' });
  }

  try {
    // Create bundle with items in a transaction
    const bundle = await prisma.bundle.create({
      data: {
        creatorId: userId,
        title,
        description,
        coverImage,
        price: parseInt(price),
        type: type || 'PHOTOSET',
        items: {
          create: items.map((item, index) => ({
            mediaType: item.mediaType,
            mediaId: item.mediaId,
            order: index,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return res.status(200).json({ ok: true, data: { bundle } });
  } catch (err) {
    console.error('Error creating bundle:', err);
    return res.status(500).json({ ok: false, error: 'Failed to create bundle' });
  }
});
