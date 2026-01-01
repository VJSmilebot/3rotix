import { prisma } from '../../../lib/prisma';
import { getSupabaseUser } from '../../../lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { squadId } = req.query;

  if (req.method === 'GET') {
    try {
      const { includeDeleted } = req.query;

      const messages = await prisma.chatMessage.findMany({
        where: {
          squadId,
          ...(includeDeleted !== 'true' && { isDeleted: false }),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              handle: true,
              image: true,
              role: true,
            },
          },
          replyTo: {
            include: {
              user: {
                select: {
                  handle: true,
                },
              },
            },
          },
          reactions: {
            select: {
              emoji: true,
              userId: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        take: 100,
      });

      return res.status(200).json(messages);
    } catch (error) {
      console.error('Get messages error:', error);
      return res.status(500).json({ error: 'Failed to get messages' });
    }
  }

  if (req.method === 'POST') {
    try {
      const user = await getSupabaseUser(req, res);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { content, replyToId, mediaUrl, mediaType } = req.body;

      if (!content && !mediaUrl) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const message = await prisma.chatMessage.create({
        data: {
          squadId,
          userId: user.id,
          content: content || '',
          mediaUrl,
          mediaType,
          replyToId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              handle: true,
              image: true,
              role: true,
            },
          },
        },
      });

      // Track chat XP
      const { trackChatActivity } = require('../../../utils/chat-tracker');
      await trackChatActivity({
        userId: user.id,
        messageCount: 1,
        messageText: content,
        messageId: message.id,
        source: "SQUAD",
      });

      // Broadcast via Supabase Realtime
      await supabase.channel(`squad-chat-${squadId}`).send({
        type: 'broadcast',
        event: 'new-message',
        payload: message,
      });

      return res.status(200).json(message);
    } catch (error) {
      console.error('Create message error:', error);
      return res.status(500).json({ error: 'Failed to send message' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}