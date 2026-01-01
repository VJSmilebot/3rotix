import { createClient } from '@supabase/supabase-js';
import { prisma } from '../../../lib/prisma';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.replace('Bearer ', '') || 
                req.cookies['sb-access-token'];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { userId: blockedId } = req.body;

  if (!blockedId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  try {
    if (req.method === 'POST') {
      // Block user
      await prisma.blockedUser.create({
        data: {
          blockerId: user.id,
          blockedId,
        },
      });

      return res.status(200).json({ success: true, message: 'User blocked' });
    } else {
      // Unblock user
      await prisma.blockedUser.deleteMany({
        where: {
          blockerId: user.id,
          blockedId,
        },
      });

      return res.status(200).json({ success: true, message: 'User unblocked' });
    }
  } catch (err) {
    console.error('Error blocking/unblocking user:', err);
    return res.status(500).json({ error: 'Failed to update block status' });
  }
}