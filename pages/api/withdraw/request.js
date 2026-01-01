import { createClient } from '@supabase/supabase-js';
import { prisma } from '../../../lib/prisma';

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

  const { amountCents, paymentMethod, paymentDetails } = req.body;

  if (!amountCents || amountCents <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  if (!paymentMethod || !paymentDetails) {
    return res.status(400).json({ error: 'Payment method and details required' });
  }

  // Minimum withdrawal: $10
  if (amountCents < 1000) {
    return res.status(400).json({ error: 'Minimum withdrawal is $10.00' });
  }

  try {
    const wallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
    });

    if (!wallet || wallet.earningsCents < amountCents) {
      return res.status(400).json({ 
        error: 'Insufficient earnings balance',
        required: amountCents,
        current: wallet?.earningsCents || 0,
      });
    }

    // Create withdrawal and deduct from earnings
    const [withdrawal, updatedWallet] = await prisma.$transaction([
      prisma.withdrawal.create({
        data: {
          userId: user.id,
          amountCents: parseInt(amountCents),
          paymentMethod,
          paymentDetails,
          status: 'PENDING',
        },
      }),
      
      prisma.wallet.update({
        where: { userId: user.id },
        data: {
          earningsCents: {
            decrement: parseInt(amountCents),
          },
        },
      }),
    ]);

    return res.status(200).json({ 
      success: true, 
      withdrawal,
      newBalance: updatedWallet.earningsCents,
    });
  } catch (err) {
    console.error('Error creating withdrawal:', err);
    return res.status(500).json({ error: 'Failed to request withdrawal' });
  }
}