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

  const { title, description, coverImage, price, totalTickets, eventDate } = req.body;

  if (!title || !price || price <= 0 || !eventDate) {
    return res.status(400).json({ error: 'Title, valid price, and event date required' });
  }

  try {
    const event = await prisma.eventTicket.create({
      data: {
        creatorId: user.id,
        title,
        description,
        coverImage,
        price: parseInt(price),
        totalTickets: totalTickets ? parseInt(totalTickets) : null,
        eventDate: new Date(eventDate),
        status: 'UPCOMING',
      },
    });

    return res.status(200).json({ success: true, event });
  } catch (err) {
    console.error('Error creating event:', err);
    return res.status(500).json({ error: 'Failed to create event' });
  }
}