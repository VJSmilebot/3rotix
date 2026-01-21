import { prisma } from '../../../lib/prisma';
import { withAuth } from '../../../lib/auth-middleware';
import crypto from 'node:crypto';

function normalizeRecipient(input) {
  const raw = (input || '').trim();
  if (!raw) return '';
  return raw.replace(/^@+/, '').trim();
}

function looksLikeEmail(s) {
  return /.+@.+\..+/.test(s);
}

export default withAuth(async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const userId = req.user.id;
  const rawRecipient = req.body?.recipient ?? req.body?.recipientUsername ?? '';
  const recipientKey = normalizeRecipient(rawRecipient);

  if (!recipientKey) {
    return res.status(400).json({ ok: false, error: 'Recipient (handle or email) is required' });
  }

  try {
    const recipient = await prisma.user.findFirst({
      where: looksLikeEmail(recipientKey)
        ? { email: { equals: recipientKey, mode: 'insensitive' } }
        : { handle: { equals: recipientKey, mode: 'insensitive' } },
      select: { id: true, handle: true, email: true },
    });

    if (!recipient) {
      return res.status(404).json({ ok: false, error: 'User not found. Use handle or email.' });
    }

    if (recipient.id === userId) {
      return res.status(400).json({ ok: false, error: 'You cannot message yourself' });
    }

    // Find existing conversation (either order)
    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { participant1Id: userId, participant2Id: recipient.id },
          { participant1Id: recipient.id, participant2Id: userId },
        ],
      },
      select: { id: true },
    });

    if (!conversation) {
      // enforce a stable ordering so you don't accidentally create duplicates later
      const [p1, p2] = [userId, recipient.id].sort();

      conversation = await prisma.conversation.create({
        data: {
          id: crypto.randomUUID(),
          participant1Id: p1,
          participant2Id: p2,
          isUnlocked: true,
          unlockPrice: 0,
          updatedAt: new Date(),
        },
        select: { id: true },
      });
    }

    return res.status(200).json({ ok: true, data: { conversationId: conversation.id } });
  } catch (err) {
    console.error('Error creating conversation:', err);
    return res.status(500).json({ ok: false, error: 'Failed to create conversation' });
  }
});
