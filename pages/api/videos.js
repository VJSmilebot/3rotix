import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, visibility } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  try {
    let query = supabase
      .from('Video')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false });

    // If visibility is specified, filter by it
    if (visibility) {
      query = query.eq('visibility', visibility);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[api/videos] fetch error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(data || []);
  } catch (err) {
    console.error('[api/videos] unexpected error:', err);
    return res.status(500).json({ error: String(err) });
  }
}