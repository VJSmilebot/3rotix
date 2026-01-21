import { prisma } from '../../../../lib/prisma';
import { withAuth } from '../../../../lib/auth-middleware';

export default withAuth(async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { squadId } = req.query;
    const { messageId, content } = req.body;
    const userId = req.user.id;

    if (!messageId || !content) {
      return res.status(400).json({ ok: false, error: 'Missing messageId or content' });
    }

    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return res.status(404).json({ ok: false, error: 'Message not found' });
    }

    if (message.userId !== userId) {
      return res.status(403).json({ ok: false, error: 'Cannot edit other users messages' });
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

    return res.status(200).json({ ok: true, data: updatedMessage });
  } catch (error) {
    console.error('Edit message error:', error);
    return res.status(500).json({ ok: false, error: error.message });
  }
});