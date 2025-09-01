// pages/api/livepeer/status.js
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { playbackId } = req.query || {};
  if (!playbackId) return res.status(400).json({ error: 'Missing playbackId' });

  if (!process.env.LIVEPEER_API_KEY) {
    return res.status(500).json({ error: 'LIVEPEER_API_KEY not configured' });
  }

  try {
    // 1) Lookup playback to find parent (stream) id
    const pbResp = await fetch(`https://livepeer.studio/api/playback/${encodeURIComponent(playbackId)}`, {
      headers: { Authorization: `Bearer ${process.env.LIVEPEER_API_KEY}` },
    });
    const pb = await pbResp.json();
    if (!pbResp.ok || !pb?.parentId) {
      return res.status(200).json({ isActive: false, details: pb || null });
    }

    // 2) Query the stream for isActive
    const stResp = await fetch(`https://livepeer.studio/api/stream/${encodeURIComponent(pb.parentId)}`, {
      headers: { Authorization: `Bearer ${process.env.LIVEPEER_API_KEY}` },
    });
    const st = await stResp.json();
    if (!stResp.ok) return res.status(200).json({ isActive: false, details: st || null });

    return res.status(200).json({
      isActive: !!st.isActive,
      lastSeen: st.lastSeen || null,
      sourceSegments: st.sourceSegments ?? null,
    });
  } catch (e) {
    console.error(e);
    return res.status(200).json({ isActive: false });
  }
}
