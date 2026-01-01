// pages/api/videos/create.js
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method-not-allowed' });
  }

  try {
    const { userId, assetId, title, visibility, fingerprintSha256 } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'missing-userId' });
    }
    if (!assetId) {
      return res.status(400).json({ error: 'missing-assetId' });
    }
    if (!title) {
      return res.status(400).json({ error: 'missing-title' });
    }

    const id = randomUUID();
    const now = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('Video')
      .insert({
        id,
        userId,
        title,
        // playbackId starts null – we set it later in update-playback
        assetId,
        visibility: visibility || 'public',
        createdAt: now,
        updatedAt: now,
        fingerprintSha256,
      })
      .select()
      .single();

    if (error) {
      console.error('[api/videos/create] insert error', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true, video: data });
  } catch (e) {
    console.error('[api/videos/create] unexpected error', e);
    return res.status(500).json({ error: String(e) });
  }
}
