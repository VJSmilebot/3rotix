import { createClient } from '@supabase/supabase-js';
import { prisma } from '../../../lib/prisma';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '') || 
                req.cookies['sb-access-token'];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const settings = await prisma.dMSettings.findUnique({
        where: { userId: user.id },
      });

      return res.status(200).json(settings || {
        allowDMs: true,
        requireUnlock: false,
        unlockPrice: 500,
        autoResponse: null,
      });
    } catch (err) {
      console.error('Error fetching settings:', err);
      return res.status(500).json({ error: 'Failed to fetch settings' });
    }
  }

  if (req.method === 'POST') {
    const { allowDMs, requireUnlock, unlockPrice, autoResponse } = req.body;

    try {
      const settings = await prisma.dMSettings.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          allowDMs: allowDMs ?? true,
          requireUnlock: requireUnlock ?? false,
          unlockPrice: unlockPrice ?? 500,
          autoResponse,
        },
        update: {
          allowDMs,
          requireUnlock,
          unlockPrice,
          autoResponse,
        },
      });

      return res.status(200).json({ success: true, settings });
    } catch (err) {
      console.error('Error updating settings:', err);
      return res.status(500).json({ error: 'Failed to update settings' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}