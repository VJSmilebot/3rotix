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

  const { withdrawalId } = req.query;

  try {
    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
    });

    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }

    if (withdrawal.userId !== user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (withdrawal.status !== 'PENDING') {
      return res.status(400).json({ error: 'Can only cancel pending withdrawals' });
    }

    // Refund to earnings
    const [updatedWithdrawal, updatedWallet] = await prisma.$transaction([
      prisma.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: 'CANCELLED',
        },
      }),
      
      prisma.wallet.update({
        where: { userId: user.id },
        data: {
          earningsCents: {
            increment: withdrawal.amountCents,
          },
        },
      }),
    ]);

    return res.status(200).json({ 
      success: true, 
      withdrawal: updatedWithdrawal,
      newBalance: updatedWallet.earningsCents,
    });
  } catch (err) {
    console.error('Error cancelling withdrawal:', err);
    return res.status(500).json({ error: 'Failed to cancel withdrawal' });
  }
}