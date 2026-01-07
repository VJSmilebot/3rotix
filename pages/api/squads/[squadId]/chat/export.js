import { prisma } from '../../../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { squadId } = req.query;

    const messages = await prisma.chatMessage.findMany({
      where: { squadId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            handle: true,
            email: true,
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
      },
      orderBy: { createdAt: 'asc' },
    });

    // Format for export
    const exportData = {
      squadId,
      exportedAt: new Date().toISOString(),
      messageCount: messages.length,
      messages: messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        author: {
          name: msg.user.name,
          handle: msg.user.handle,
          email: msg.user.email,
        },
        timestamp: msg.createdAt,
        isEdited: msg.isEdited,
        isPinned: msg.isPinned,
        replyTo: msg.replyTo ? {
          id: msg.replyTo.id,
          content: msg.replyTo.content,
          author: msg.replyTo.user.handle,
        } : null,
      })),
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="chat-export-${squadId}-${Date.now()}.json"`);
    
    return res.status(200).json(exportData);
  } catch (error) {
    console.error('Export error:', error);
    return res.status(500).json({ error: 'Failed to export chat' });
  }
}