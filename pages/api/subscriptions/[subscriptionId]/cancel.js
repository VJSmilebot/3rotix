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

  const { subscriptionId } = req.query;

  try {
    const subscription = await prisma.userSubscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    if (subscription.userId !== user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (subscription.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Subscription is not active' });
    }

    // Mark for cancellation at period end
    const updated = await prisma.userSubscription.update({
      where: { id: subscriptionId },
      data: {
        cancelAtPeriodEnd: true,
        cancelledAt: new Date(),
      },
    });

    return res.status(200).json({ 
      success: true, 
      subscription: updated,
      message: 'Subscription will cancel at end of current period',
    });
  } catch (err) {
    console.error('Error cancelling subscription:', err);
    return res.status(500).json({ error: 'Failed to cancel subscription' });
  }
}