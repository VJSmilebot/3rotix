import { SignJWT, importPKCS8 } from 'jose';
import { createSupabaseServerClient } from '../../../utils/supabase/server'; // <-- UPDATED IMPORT

/**
 * POST /api/livepeer/sign
 * Body: { playbackId }
 * Header: Authorization: Bearer <viewer supabase access token>
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Use our new server-side helper, passing in the request and response
  const supabaseAdmin = createSupabaseServerClient(req, res); // <-- UPDATED

  try {
    const { playbackId } = req.body || {};
    if (!playbackId) return res.status(400).json({ error: 'Missing playbackId' });

    // 1) Get auth token if provided
    const authHeader = req.headers.authorization || '';
    const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    let viewer = null;
    if (accessToken) {
      const { data: userData, error: authErr } = await supabaseAdmin.auth.getUser(accessToken);
      if (!authErr && userData?.user) {
        viewer = userData.user;
      }
    }

    // 2) Look up the video by playbackId
    const { data: video, error: dbErr } = await supabaseAdmin
      .from('videos')
      .select('id, user_id, visibility')
      .eq('playback_id', playbackId)
      .maybeSingle(); // .maybeSingle() is cleaner than .limit(1)

    if (dbErr) {
      console.error('Database error in sign endpoint:', dbErr);
      return res.status(200).json({ token: null }); // Fallback to public
    }

    if (!video) {
      return res.status(200).json({ token: null }); // Fallback to public
    }

    // 3) Public vs Private
    if (video.visibility !== 'private') {
      return res.status(200).json({ token: null });
    }

    // Private → only owner may view
    if (!viewer || viewer.id !== video.user_id) {
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