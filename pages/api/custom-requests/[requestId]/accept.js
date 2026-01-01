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

  const { requestId } = req.query;
  const { deadline } = req.body;

  try {
    const request = await prisma.customRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.creatorId !== user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ error: 'Request is not pending' });
    }

    const updatedRequest = await prisma.customRequest.update({
      where: { id: requestId },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
        deadline: deadline ? new Date(deadline) : null,
      },
    });

    return res.status(200).json({ success: true, request: updatedRequest });
  } catch (err) {
    console.error('Error accepting request:', err);
    return res.status(500).json({ error: 'Failed to accept request' });
  }
}