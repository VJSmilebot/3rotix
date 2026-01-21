import { prisma } from '../../../lib/prisma';
import { withAuth } from '../../../lib/auth-middleware';

export default withAuth(async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const userId = req.user.id;
  const { title, description, coverImage, price, totalTickets, eventDate } = req.body || {};

  if (!title || !price || price <= 0 || !eventDate) {
    return res.status(400).json({ ok: false, error: 'Title, valid price, and event date required' });
  }

  try {
    const event = await prisma.eventTicket.create({
      data: {
        creatorId: userId,
        title,
        description,
        coverImage,
        price: parseInt(price),
        totalTickets: totalTickets ? parseInt(totalTickets) : null,
        eventDate: new Date(eventDate),
        status: 'UPCOMING',
      },
    });

    return res.status(200).json({ ok: true, data: { success: true, event } });
  } catch (err) {
    console.error('Error creating event:', err);
    return res.status(500).json({ ok: false, error: 'Failed to create event' });
  }
});
