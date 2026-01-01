import { createClient } from '@supabase/supabase-js';
import { prisma } from '../../../../lib/prisma';

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
    // Get current settings
    try {
      const wallet = await prisma.wallet.findUnique({
        where: { userId: user.id },
        select: {
          autoTopUpEnabled: true,
          autoTopUpThreshold: true,
          autoTopUpAmount: true,
          stripeCustomerId: true,
          stripePaymentMethodId: true,
        },
      });

      return res.status(200).json(wallet || {
        autoTopUpEnabled: false,
        autoTopUpThreshold: 100,
        autoTopUpAmount: 500,
      });
    } catch (err) {
      console.error('Error fetching settings:', err);
      return res.status(500).json({ error: 'Failed to fetch settings' });
    }
  }

  if (req.method === 'POST') {
    // Update settings
    const { enabled, threshold, amount, stripeCustomerId, stripePaymentMethodId } = req.body;

    try {
      const wallet = await prisma.wallet.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          lipzBalance: 0,
          earningsCents: 0,
          autoTopUpEnabled: enabled || false,
          autoTopUpThreshold: threshold || 100,
          autoTopUpAmount: amount || 500,
          stripeCustomerId,
          stripePaymentMethodId,
        },
        update: {
          autoTopUpEnabled: enabled,
          autoTopUpThreshold: threshold,
          autoTopUpAmount: amount,
          ...(stripeCustomerId && { stripeCustomerId }),
          ...(stripePaymentMethodId && { stripePaymentMethodId }),
        },
      });

      return res.status(200).json({ 
        success: true, 
        wallet,
        message: enabled ? 'Auto-top-up enabled' : 'Auto-top-up disabled',
      });
    } catch (err) {
      console.error('Error updating settings:', err);
      return res.status(500).json({ error: 'Failed to update settings' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}