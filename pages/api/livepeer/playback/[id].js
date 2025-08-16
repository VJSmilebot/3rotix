// pages/api/livepeer/playback/[id].js
export default async function handler(req, res) {
  const { id } = req.query; // playbackId
  if (!id) return res.status(400).json({ error: 'missing-playbackId' });

  try {
    // Ask Livepeer for playback info
    const r = await fetch(`https://livepeer.studio/api/playback/${id}`, {
      headers: { Authorization: `Bearer ${process.env.LIVEPEER_API_KEY}` },
      cache: 'no-store',
      redirect: 'follow',
    });
    const j = await r.json();
    if (!r.ok) return res.status(r.status).json(j);

    // Pull an HLS URL from the response (shape can vary)
    let hls =
      j?.source?.hls ||
      j?.source?.[0]?.hls ||
      j?.meta?.playbackUrls?.hls ||
      `https://livepeercdn.studio/hls/${id}/index.m3u8`;

    // Resolve redirects server-side to get a stable, canonical URL
    // (e.g., livepeercdn.studio -> playback.livepeer.studio)
    let finalUrl = hls;
    try {
      const follow = await fetch(hls, {
        method: 'GET',
        redirect: 'follow',
        cache: 'no-store',
      });
      // If it 200s after following, use the final response URL
      if (follow.ok) finalUrl = follow.url || hls;
    } catch {
      // ignore, fall back to original hls
    }

    return res.status(200).json({ hlsUrl: finalUrl, from: hls });
  } catch (e) {
    return res.status(500).json({ error: 'server-error', detail: String(e) });
  }
}
