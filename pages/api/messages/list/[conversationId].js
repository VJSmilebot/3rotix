import { createClient } from '@supabase/supabase-js';
import { prisma } from '../../../../lib/prisma';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const conversationId = Array.isArray(req.query.conversationId)
    ? req.query.conversationId[0]
    : req.query.conversationId;

  if (!conversationId) return res.status(400).json({ error: 'Missing conversationId' });

  const token =
    req.headers.authorization?.replace('Bearer ', '') ||
    req.cookies['sb-access-token'];

  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true, participant1Id: true, participant2Id: true },
    });

    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    const isParticipant = conversation.participant1Id === user.id || conversation.participant2Id === user.id;
    if (!isParticipant) return res.status(403).json({ error: 'Not allowed' });

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });

    // IMPORTANT: no updateMany for isRead/readAt/receiverId (you don’t have those fields)
    return res.status(200).json(messages);
  } catch (err) {
    console.error('Error listing messages:', err);
    return res.status(500).json({ error: 'Failed to list messages' });
  }
}
