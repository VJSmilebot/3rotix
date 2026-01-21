import { createClient } from '@supabase/supabase-js';
import { prisma } from '../../../lib/prisma';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
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

  try {
    const withdrawals = await prisma.withdrawal.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json(withdrawals);
  } catch (err) {
    console.error('Error fetching withdrawals:', err);
    return res.status(500).json({ error: 'Failed to fetch withdrawals' });
  }
}