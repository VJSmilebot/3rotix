// pages/api/livepeer/sign.js
import { SignJWT, importPKCS8 } from 'jose';
import { createClient } from '@supabase/supabase-js';

// Server-only Supabase client (uses service role)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/livepeer/sign
 * Body: { playbackId }
 * Header: Authorization: Bearer <viewer supabase access token>
 *
 * - If video is PUBLIC → returns { token: null } (no JWT needed)
 * - If PRIVATE → only the video owner gets a signed JWT
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { playbackId } = req.body || {};
    if (!playbackId) return res.status(400).json({ error: 'Missing playbackId' });

    // 1) Verify viewer is logged in (via Supabase access token)
    const authHeader = req.headers.authorization || '';
    const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!accessToken) return res.status(401).json({ error: 'Not authenticated' });

    const { data: userData, error: authErr } = await supabaseAdmin.auth.getUser(accessToken);
    if (authErr || !userData?.user) return res.status(401).json({ error: 'Invalid auth token' });
    const viewer = userData.user;

    // 2) Look up the video by playbackId
    const { data: rows, error: dbErr } = await supabaseAdmin
      .from('videos')
      .select('id, user_id, visibility')
      .eq('playback_id', playbackId)
      .limit(1);

    if (dbErr) return res.status(500).json({ error: 'DB error', detail: dbErr.message });

    const video = Array.isArray(rows) && rows[0] ? rows[0] : null;
    if (!video) return res.status(404).json({ error: 'Video not found' });

    // 3) Public vs Private
    if (video.visibility !== 'private') {
      // Public → no token needed
      return res.status(200).json({ token: null });
    }

    // Private → only owner may view (you can expand this rule later)
    if (viewer.id !== video.user_id) {
      return res.status(403).json({ error: 'Not allowed to view this private video' });
    }

    // 4) Sign a Livepeer playback JWT
    const privateKey = process.env.ACCESS_CONTROL_PRIVATE_KEY;
    const kid = process.env.ACCESS_CONTROL_PUBLIC_KEY_ID;
    if (!privateKey || !kid) {
      return res.status(500).json({ error: 'Access control keys not configured' });
    }

    const alg = 'RS256';
    const key = await importPKCS8(privateKey, alg);

    // subject MUST be the playbackId
    const token = await new SignJWT({})
      .setProtectedHeader({ alg, kid })
      .setSubject(playbackId)
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(key);

    return res.status(200).json({ token });
  } catch (e) {
    return res.status(500).json({ error: 'sign-failed', detail: String(e?.message || e) });
  }
}
