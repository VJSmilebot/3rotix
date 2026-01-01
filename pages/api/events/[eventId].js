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

  const { eventId } = req.query;

  if (!eventId) {
    return res.status(400).json({ error: 'Event ID required' });
  }

  const token = req.headers.authorization?.replace('Bearer ', '') || 
                req.cookies['sb-access-token'];

  let userId = null;
  let hasPurchased = false;

  if (token) {
    const { data: { user } } = await supabase.auth.getUser(token);
    if (user) {
      userId = user.id;
      
      const purchase = await prisma.eventTicketPurchase.findUnique({
        where: {
          eventTicketId_userId: {
            eventTicketId: eventId,
            userId,
          },
        },
      });
      
      hasPurchased = !!purchase;
    }
  }

  try {
    const event = await prisma.eventTicket.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: { purchases: true },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Don't reveal stream URL unless purchased or is creator
    if (!hasPurchased && event.creatorId !== userId) {
      return res.status(200).json({
        ...event,
        streamUrl: null,
        hasPurchased: false,
      });
    }

    return res.status(200).json({
      ...event,
      hasPurchased,
    });
  } catch (err) {
    console.error('Error fetching event:', err);
    return res.status(500).json({ error: 'Failed to fetch event' });
  }
}