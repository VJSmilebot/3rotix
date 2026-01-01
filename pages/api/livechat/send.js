import { createClient } from '@supabase/supabase-js';
import { prisma } from '../../../lib/prisma';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { playbackId, handle, role, text } = req.body;

  if (!playbackId || !text) {
    return res.status(400).json({ error: 'Playback ID and text required' });
  }

  try {
    // Insert message
    const message = await prisma.chatMessage.create({
      data: {
        playbackId,
        handle,
        role: role || 'viewer',
        text,
      },
    });

    // Track XP for live chat
    const { trackChatActivity } = require('../../../utils/chat-tracker');
    await trackChatActivity({
      userId: null, // Live chat doesn't have userId, perhaps skip XP or find user by handle?
      messageCount: 1,
      messageText: text,
      messageId: message.id,
      source: "GLOBAL",
    });

    // Broadcast via Supabase Realtime
    await supabase.channel(`chat:${playbackId}`).send({
      type: 'broadcast',
      event: 'msg',
      payload: message,
    });

    return res.status(200).json({ message });
  } catch (err) {
    console.error('Error sending live chat message:', err);
    return res.status(500).json({ error: 'Failed to send message' });
  }
}