// pages/api/videos/create.js
import { prisma } from '../../../lib/prisma';
import { withAuth } from '../../../lib/auth-middleware';
import { randomUUID } from 'crypto';

export default withAuth(async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method-not-allowed' });
  }

  const userId = req.user.id;
  const { assetId, title, visibility, fingerprintSha256 } = req.body || {};

  if (!assetId) {
    return res.status(400).json({ ok: false, error: 'missing-assetId' });
  }
  if (!title) {
    return res.status(400).json({ ok: false, error: 'missing-title' });
  }

  try {
    const id = randomUUID();

    const video = await prisma.video.create({
      data: {
        id,
        userId,
        title,
        assetId,
        visibility: visibility || 'public',
        fingerprintSha256,
      },
    });

    return res.status(200).json({ ok: true, data: { success: true, video } });
  } catch (e) {
    console.error('[api/videos/create] error:', e);
    return res.status(500).json({ ok: false, error: String(e) });
  }
});
