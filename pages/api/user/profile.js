// /pages/api/user/profile.js
import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, handle } = req.query;

    console.log('Profile request:', { userId, handle });

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
        console.log('User not found for userId:', userId);
        return res.status(404).json({ error: 'User not found' });
      }

      console.log('Found user:', user);
      return res.status(200).json(user);
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
        console.log('User not found for handle:', handle);
        return res.status(404).json({ error: 'User not found' });
      }

      console.log('Found user:', user);
      return res.status(200).json(user);
    }

    return res.status(400).json({ error: 'userId or handle required' });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch profile' });
  }
}
  