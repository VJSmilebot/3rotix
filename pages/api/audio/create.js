// pages/api/audio/create.js
import { supabaseAdmin } from '../../../lib/supabaseAdmin.js';
import { withAuth } from '../../../lib/auth-middleware.js';
import { randomUUID } from 'crypto';

export default withAuth(async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method-not-allowed' });
  }

  try {
    const userId = req.user.id; // Derive from session, not body
    const { assetId, title, visibility } = req.body || {};

    if (!assetId) {
      return res.status(400).json({ ok: false, error: 'missing-assetId' });
    }
    if (!title) {
      return res.status(400).json({ ok: false, error: 'missing-title' });
    }

    const id = randomUUID();
    const now = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('Audio')
      .insert({
        id,
        userId,
        title,
        assetId,
        visibility: visibility || 'public',
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single();

    if (error) {
      console.error('[api/audio/create] insert error', error);
      return res.status(500).json({ ok: false, error: error.message });
    }

    return res.status(200).json({ ok: true, data });
  } catch (e) {
    console.error('[api/audio/create] unexpected error', e);
    return res.status(500).json({ ok: false, error: String(e) });
  }
});
