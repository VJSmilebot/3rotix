import { createClient } from '@supabase/supabase-js';
import { prisma } from '../../../../lib/prisma';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
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

  const { name, description, pricePerMonth, benefits, color, trialDays } = req.body;

  if (!name || !pricePerMonth || pricePerMonth <= 0) {
    return res.status(400).json({ error: 'Name and valid price required' });
  }

  try {
    // Get display order (add to end)
    const existingTiers = await prisma.subscriptionTier.count({
      where: { creatorId: user.id },
    });

    const tier = await prisma.subscriptionTier.create({
      data: {
        creatorId: user.id,
        name,
        description,
        pricePerMonth: parseInt(pricePerMonth),
        benefits: benefits || [],
        color: color || '#6B7280',
        trialDays: trialDays || 0,
        displayOrder: existingTiers,
      },
    });

    return res.status(200).json({ success: true, tier });
  } catch (err) {
    console.error('Error creating tier:', err);
    return res.status(500).json({ error: 'Failed to create tier' });
  }
}   