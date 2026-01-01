import { createClient } from '@supabase/supabase-js';
import { prisma } from '../../../lib/prisma';
import crypto from 'node:crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function normalizeRecipient(input) {
  const raw = (input || '').trim();
  if (!raw) return '';
  return raw.replace(/^@+/, '').trim();
}

function looksLikeEmail(s) {
  // simple + good enough for “ship fast”
  return /.+@.+\..+/.test(s);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token =
    req.headers.authorization?.replace('Bearer ', '') ||
    req.cookies['sb-access-token'];

  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

  const rawRecipient = req.body?.recipient ?? req.body?.recipientUsername ?? '';
  const recipientKey = normalizeRecipient(rawRecipient);

  if (!recipientKey) {
    return res.status(400).json({ error: 'Recipient (handle or email) is required' });
  }

  try {
    const recipient = await prisma.user.findFirst({
      where: looksLikeEmail(recipientKey)
        ? { email: { equals: recipientKey, mode: 'insensitive' } }
        : { handle: { equals: recipientKey, mode: 'insensitive' } },
      select: { id: true, handle: true, email: true },
    });

    if (!recipient) {
      return res.status(404).json({ error: 'User not found. Use handle or email.' });
    }

    if (recipient.id === user.id) {
      return res.status(400).json({ error: 'You cannot message yourself' });
    }

    // Find existing conversation (either order)
    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { participant1Id: user.id, participant2Id: recipient.id },
          { participant1Id: recipient.id, participant2Id: user.id },
        ],
      },
      select: { id: true },
    });

    if (!conversation) {
      // enforce a stable ordering so you don’t accidentally create duplicates later
      const [p1, p2] = [user.id, recipient.id].sort();

      conversation = await prisma.conversation.create({
        data: {
          id: crypto.randomUUID(),
          participant1Id: p1,
          participant2Id: p2,
          isUnlocked: true,
          unlockPrice: 0,

          // Your Conversation schema currently requires this (based on your earlier Prisma error).
          updatedAt: new Date(),
        },
        select: { id: true },
      });
    }

    return res.status(200).json({ conversationId: conversation.id });
  } catch (err) {
    console.error('Error creating conversation:', err);
    return res.status(500).json({ error: 'Failed to create conversation' });
  }
}
