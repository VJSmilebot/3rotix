import { withAuth } from "../../../../lib/auth-middleware.js";
import { prisma } from "../../../../lib/prisma.js";

export default withAuth(async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { conversationId } = req.query;
  const userId = req.user.id;

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return res.status(404).json({ ok: false, error: 'Conversation not found' });
    }

    const isParticipant =
      conversation.participant1Id === userId || conversation.participant2Id === userId;

    if (!isParticipant) {
      return res.status(403).json({ ok: false, error: 'Not allowed' });
    }

    return res.status(200).json({ ok: true, data: conversation });
  } catch (err) {
    console.error('Error loading conversation:', err);
    return res.status(500).json({ ok: false, error: 'Failed to load conversation' });
  }
});
