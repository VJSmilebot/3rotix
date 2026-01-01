import { createClient } from '@supabase/supabase-js';
import { prisma } from '../../../lib/prisma';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
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

  const { messageId, emoji } = req.body;

  if (!messageId || !emoji) {
    return res.status(400).json({ error: 'Message ID and emoji required' });
  }

  try {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const reactions = message.reactions || {};

    if (req.method === 'POST') {
      if (!reactions[emoji]) {
        reactions[emoji] = [];
      }
      
      if (!reactions[emoji].includes(user.id)) {
        reactions[emoji].push(user.id);
      }
    } else {
      if (reactions[emoji]) {
        reactions[emoji] = reactions[emoji].filter(id => id !== user.id);
        
        if (reactions[emoji].length === 0) {
          delete reactions[emoji];
        }
      }
    }

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: { reactions },
    });

    return res.status(200).json({ success: true, reactions: updatedMessage.reactions });
  } catch (err) {
    console.error('Reaction error:', err);
    return res.status(500).json({ error: 'Failed to update reaction' });
  }
}