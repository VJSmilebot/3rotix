import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  // GET - Fetch user by ID
  if (req.method === 'GET') {
    try {
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
        return res.status(404).json({ error: 'User not found' });
      }

      return res.status(200).json(user);
    } catch (error) {
      console.error('Fetch user error:', error);
      return res.status(500).json({ error: 'Failed to fetch user' });
    }
  }

  // PATCH - Update user profile
  if (req.method === 'PATCH') {
    try {
      const { name, bio, image } = req.body;

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (bio !== undefined) updateData.bio = bio;
      if (image !== undefined) updateData.image = image;

      const user = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          handle: true,
          image: true,
          bio: true,
          role: true,
          totalXp: true,
        }
      });

      return res.status(200).json(user);
    } catch (error) {
      console.error('Update user error:', error);
      return res.status(500).json({ error: 'Failed to update user' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}