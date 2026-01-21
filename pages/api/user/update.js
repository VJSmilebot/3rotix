// /pages/api/user/update.js
import { prisma } from '../../../lib/prisma';
import { withAuth } from '../../../lib/auth-middleware';

export default withAuth(async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'PUT') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const userId = req.user.id;
  const { name, handle, bio, website, twitter, instagram, image } = req.body || {};

  // Validate handle uniqueness if provided
  if (handle) {
    const existingUser = await prisma.user.findUnique({
      where: { handle }
    });
    
    if (existingUser && existingUser.id !== userId) {
      return res.status(400).json({ ok: false, error: 'Handle already taken' });
    }
  }

  // Build update data object with only provided fields
  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (handle !== undefined) updateData.handle = handle;
  if (bio !== undefined) updateData.bio = bio;
  if (website !== undefined) updateData.website = website;
  if (twitter !== undefined) updateData.twitter = twitter;
  if (instagram !== undefined) updateData.instagram = instagram;
  if (image !== undefined) updateData.image = image;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        handle: true,
        image: true,
        bio: true,
        website: true,
        twitter: true,
        instagram: true,
        role: true,
        totalXp: true,
        rank: true,
        level: true,
      }
    });

    return res.status(200).json({ ok: true, data: updatedUser });
  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(500).json({ ok: false, error: error.message || 'Database error' });
  }
});
