import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'email required' });
    }

    console.log('Looking up user by email:', email);

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        handle: true,
        image: true,
        bio: true,  // Added this - you had it missing!
        role: true,
        totalXp: true,
        createdAt: true,
      }
    });

    if (!user) {
      console.log('User not found for email:', email);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Found user:', user);
    return res.status(200).json(user);
  } catch (error) {
    console.error('Fetch user by email error:', error);
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
}