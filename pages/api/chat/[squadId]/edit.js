import { prisma } from '../../../../lib/prisma';
import { createSupabaseServerClient } from '../../../../utils/supabase/server';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { squadId } = req.query;
    const { messageId, content } = req.body;

    const supabase = createSupabaseServerClient(req, res);
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { email: authUser.email },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.userId !== user.id) {
      return res.status(403).json({ error: 'Cannot edit other users messages' });
    }

    const updatedMessage = await prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        content,
        isEdited: true,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            handle: true,
            image: true,
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });

    return res.status(200).json(updatedMessage);
  } catch (error) {
    console.error('Edit message error:', error);
    return res.status(500).json({ error: error.message });
  }
}