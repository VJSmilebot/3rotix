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
    const { userId, url, storageKey, title, description, visibility, thumbnailUrl } = req.body || {};

    if (!userId) {
      return res.status(400).json({ error: 'missing-userId' });
    }
    if (!url || !storageKey) {
      return res.status(400).json({ error: 'missing-url-or-storageKey' });
    }

    const id = randomUUID();
    const now = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('Image')
      .insert({
        id,
        userId,
        url,
        storageKey,
        title: title || null,
        description: description || null,
        visibility: visibility || 'public',
        thumbnailUrl: thumbnailUrl || null,
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single();

    if (error) {
      console.error('[api/images/create] insert error', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true, image: data });
  } catch (e) {
    console.error('[api/images/create] unexpected error', e);
    return res.status(500).json({ error: String(e) });
  }
}