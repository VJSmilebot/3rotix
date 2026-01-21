import { withAuth } from "../../lib/auth-middleware.js";
import { prisma } from "../../lib/prisma.js";

export default withAuth(async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { userId, visibility } = req.query;

  if (!userId) {
    return res.status(400).json({ ok: false, error: 'Missing userId' });
  }

  try {
    const where = {
      userId,
    };

    if (visibility) {
      where.visibility = visibility;
    }

    const audio = await prisma.audio.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ ok: true, data: audio || [] });
  } catch (err) {
    console.error('[api/audio] error:', err);
    return res.status(500).json({ ok: false, error: String(err) });
  }
});
