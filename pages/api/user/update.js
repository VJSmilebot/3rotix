// /pages/api/user/update.js
import { prisma } from '../../../lib/prisma';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Get authenticated user from request
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = user.id;

    // Extract profile data from request
    const { name, handle, bio, website, twitter, instagram, image } = req.body;

    // Validate handle uniqueness if provided
    if (handle) {
      const existingUser = await prisma.user.findUnique({
        where: { handle }
      });
      
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ error: 'Handle already taken' });
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

    // Update user in Prisma
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

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(500).json({ 
      error: error.message,
      details: error.meta?.cause || 'Database error'
    });
  }
}
