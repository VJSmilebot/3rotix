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

  const token = req.headers.authorization?.replace('Bearer ', '') || 
                req.cookies['sb-access-token'];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { participant1Id: user.id },
          { participant2Id: user.id },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    
    // Get other participant info
    const conversationsWithUsers = await Promise.all(
      conversations.map(async (conv) => {
        const otherUserId = conv.participant1Id === user.id
          ? conv.participant2Id
          : conv.participant1Id;

        // Fetch user profile from database
        const profile = await prisma.user.findUnique({
          where: { id: otherUserId },
          select: { id: true, name: true, handle: true, image: true },
        });

        // don't attempt to count unread messages using missing fields
        const unreadCount = 0;

        const lastMessage = conv.messages[0];
        const lastMessageAt = lastMessage ? lastMessage.createdAt : conv.createdAt;
        const lastMessagePreview = lastMessage ? (lastMessage.content || 'Media message') : null;

        return {
          ...conv,
          otherUser: profile ? {
            displayName: profile.name,
            username: profile.handle,
            avatarUrl: profile.image,
          } : null,
          unreadCount,
          lastMessageAt,
          lastMessagePreview,
        };
      })
    );

    return res.status(200).json(conversationsWithUsers);
  } catch (err) {
    console.error('Error fetching conversations:', err);
    return res.status(500).json({ error: 'Failed to fetch conversations' });
  }
}