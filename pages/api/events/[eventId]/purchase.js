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

  const { eventId } = req.query;

  if (!eventId) {
    return res.status(400).json({ error: 'Event ID required' });
  }

  try {
    const event = await prisma.eventTicket.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (!event.isActive) {
      return res.status(400).json({ error: 'Event is not available' });
    }

    if (event.status === 'ENDED' || event.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Event has ended or been cancelled' });
    }

    if (event.creatorId === user.id) {
      return res.status(400).json({ error: "You can't purchase your own event ticket" });
    }

    // Check if already purchased
    const existingPurchase = await prisma.eventTicketPurchase.findUnique({
      where: {
        eventTicketId_userId: {
          eventTicketId: eventId,
          userId: user.id,
        },
      },
    });

    if (existingPurchase) {
      return res.status(400).json({ error: 'You already have a ticket for this event' });
    }

    // Check if sold out
    if (event.totalTickets && event.soldTickets >= event.totalTickets) {
      return res.status(400).json({ error: 'Event is sold out' });
    }

    // Get user's wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
    });

    if (!wallet || wallet.lipzBalance < event.price) {
      return res.status(400).json({ 
        error: 'Insufficient Lipz balance',
        required: event.price,
        current: wallet?.lipzBalance || 0,
      });
    }

    // Calculate fees
    const platformFeeCents = Math.floor((event.price * 0.10) * 100);
    const creatorNetCents = Math.floor(event.price * 0.90 * 100);

    // Execute purchase in transaction
    const [purchase, updatedBuyerWallet, updatedCreatorWallet, updatedEvent, transaction] = await prisma.$transaction([
      // Create purchase record
      prisma.eventTicketPurchase.create({
        data: {
          eventTicketId: eventId,
          userId: user.id,
          lipzPaid: event.price,
        },
      }),
      
      // Deduct Lipz from buyer
      prisma.wallet.update({
        where: { userId: user.id },
        data: {
          lipzBalance: {
            decrement: event.price,
          },
        },
      }),
      
      // Add earnings to creator
      prisma.wallet.upsert({
        where: { userId: event.creatorId },
        create: {
          userId: event.creatorId,
          lipzBalance: 0,
          earningsCents: creatorNetCents,
        },
        update: {
          earningsCents: {
            increment: creatorNetCents,
          },
        },
      }),

      // Increment sold tickets
      prisma.eventTicket.update({
        where: { id: eventId },
        data: {
          soldTickets: {
            increment: 1,
          },
        },
      }),
      
      // Log transaction
      prisma.transaction.create({
        data: {
          userId: user.id,
          creatorId: event.creatorId,
          type: 'EVENT_TICKET',
          lipzAmount: event.price,
          amountCents: event.price * 100,
          platformFeeCents,
          creatorNetCents,
          metadata: {
            eventTicketId: eventId,
            eventTitle: event.title,
            eventDate: event.eventDate,
          },
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      purchase,
      newBalance: updatedBuyerWallet.lipzBalance,
      event: updatedEvent,
    });
  } catch (err) {
    console.error('Error purchasing ticket:', err);
    return res.status(500).json({ error: 'Failed to purchase ticket' });
  }
}