import { prisma } from '../../../lib/prisma';
import { withAuth } from '../../../lib/auth-middleware';
import { randomUUID } from 'crypto';

export default withAuth(async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method-not-allowed' });
  }

  const userId = req.user.id;
  const { url, storageKey, title, description, visibility, thumbnailUrl } = req.body || {};

  if (!url || !storageKey) {
    return res.status(400).json({ ok: false, error: 'missing-url-or-storageKey' });
  }

  try {
    const id = randomUUID();
    const now = new Date().toISOString();

    const image = await prisma.image.create({
      data: {
        id,
        userId,
        url,
        storageKey,
        title: title || null,
        description: description || null,
        visibility: visibility || 'public',
        thumbnailUrl: thumbnailUrl || null,
      },
    });

    return res.status(200).json({ ok: true, data: { success: true, image } });
  } catch (e) {
    console.error('[api/images/create] error:', e);
    return res.status(500).json({ ok: false, error: String(e) });
  }
});
