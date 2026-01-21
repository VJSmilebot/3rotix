// pages/api/audio/update-playback.js
import { supabaseAdmin } from '../../../lib/supabaseAdmin.js';
import { withAuth } from '../../../lib/auth-middleware.js';

export default withAuth(async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method-not-allowed' });
  }

  try {
    const { assetId, playbackId } = req.body || {};

    if (!assetId) {
      return res.status(400).json({ ok: false, error: 'missing-assetId' });
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
      return res.status(500).json({ ok: false, error: error.message });
    }

    return res.status(200).json({ ok: true, data });
  } catch (e) {
    console.error('[api/audio/update-playback] unexpected error', e);
    return res.status(500).json({ ok: false, error: String(e) });
  }
});
