// pages/api/audio/update-playback.js
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method-not-allowed' });
  }

  try {
    const { assetId, playbackId } = req.body || {};

    if (!assetId) {
      return res.status(400).json({ error: 'missing-assetId' });
    }

    const now = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('Audio')
      .update({
        playbackId: playbackId || null,
        updatedAt: now,
      })
      .eq('assetId', assetId)
      .select()
      .single();

    if (error) {
      console.error('[api/audio/update-playback] update error', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true, audio: data });
  } catch (e) {
    console.error('[api/audio/update-playback] unexpected error', e);
    return res.status(500).json({ error: String(e) });
  }
}
