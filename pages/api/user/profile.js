// /pages/api/user/profile.js
import { prisma } from '../../../lib/prisma';

// Public endpoint - allows viewing user profiles by userId or handle
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { userId, handle } = req.query;

    if (!userId && !handle) {
      return res.status(400).json({ ok: false, error: 'userId or handle required' });
    }

    // If userId provided, fetch directly
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          handle: true,
          image: true,
          bio: true,
          role: true,
          totalXp: true,
          createdAt: true,
        }
      });

      if (!user) {
        return res.status(404).json({ ok: false, error: 'User not found' });
      }

      return res.status(200).json({ ok: true, data: user });
    }

    // If handle provided, fetch by handle
    if (handle) {
      const user = await prisma.user.findUnique({
        where: { handle },
        select: {
          id: true,
          name: true,
          handle: true,
          image: true,
          bio: true,
          role: true,
          totalXp: true,
          createdAt: true,
        }
      });

      if (!user) {
        return res.status(404).json({ ok: false, error: 'User not found' });
      }

      return res.status(200).json({ ok: true, data: user });
    }
  } catch (error) {
    console.error('Profile fetch error:', error);
    return res.status(500).json({ ok: false, error: error.message || 'Failed to fetch profile' });
  }
}
